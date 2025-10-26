import './style.css'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cache for portfolio items
let portfolioCache = null
let portfolioCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function loadPortfolioItems() {
  const portfolioGrid = document.getElementById('portfolio-grid')

  try {
    // Check cache first
    const now = Date.now()
    if (portfolioCache && (now - portfolioCacheTime) < CACHE_DURATION) {
      renderPortfolioItems(portfolioCache, portfolioGrid)
      return
    }

    const { data: items, error } = await supabase
      .from('portfolio_items')
      .select('id, title, category, description, image_url, video_thumbnail_url, vimeo_url, photo_360_url')
      .eq('is_visible', true)
      .order('order_index', { ascending: true })
      .limit(20)

    if (error) throw error

    // Update cache
    portfolioCache = items
    portfolioCacheTime = now

    renderPortfolioItems(items, portfolioGrid)
  } catch (error) {
    console.error('Error loading portfolio items:', error)
    portfolioGrid.innerHTML = '<p style="color: var(--color-text-muted); grid-column: 1 / -1; text-align: center; padding: 3rem;">Portfolio items laden mislukt.</p>'
  }
}

function renderPortfolioItems(items, portfolioGrid) {
  if (!items || items.length === 0) {
    portfolioGrid.innerHTML = '<p style="color: var(--color-text-muted); grid-column: 1 / -1; text-align: center; padding: 3rem;">Binnenkort beschikbaar...</p>'
    return
  }

  portfolioGrid.innerHTML = items.map(item => {
      const hasVideo = item.vimeo_url
      const has360Photo = item.photo_360_url

      const playIconHtml = hasVideo ? `
        <div class="portfolio-play-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      ` : ''

      const view360IconHtml = has360Photo ? `
        <div class="portfolio-360-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8 S16.41,20,12,20z"/>
            <path d="M12,6c-3.31,0-6,2.69-6,6s2.69,6,6,6s6-2.69,6-6S15.31,6,12,6z M12,16c-2.21,0-4-1.79-4-4s1.79-4,4-4s4,1.79,4,4 S14.21,16,12,16z"/>
          </svg>
        </div>
      ` : ''

      const thumbnailUrl = hasVideo && item.video_thumbnail_url
        ? item.video_thumbnail_url
        : item.image_url

      return `
        <div class="portfolio-item" data-id="${item.id}" ${hasVideo ? `data-vimeo="${item.vimeo_url}"` : ''} ${has360Photo ? `data-360="${item.photo_360_url}"` : ''}>
          ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="${item.title}" loading="lazy" decoding="async" />` : ''}
          ${playIconHtml}
          ${view360IconHtml}
          <div class="portfolio-overlay">
            <span class="portfolio-category">${item.category || 'Portfolio'}</span>
            <h3 class="portfolio-title">${item.title}</h3>
            ${item.description ? `<p style="color: var(--color-text-muted); margin-top: 0.5rem;">${item.description}</p>` : ''}
          </div>
        </div>
      `
    }).join('')

    portfolioGrid.querySelectorAll('.portfolio-item[data-vimeo]').forEach(item => {
      item.addEventListener('click', () => {
        const vimeoUrl = item.dataset.vimeo
        const title = item.querySelector('.portfolio-title').textContent
        if (vimeoUrl) {
          openVideoViewer(vimeoUrl, title)
        }
      })
    })

    portfolioGrid.querySelectorAll('.portfolio-item[data-360]').forEach(item => {
      item.addEventListener('click', () => {
        const photo360Url = item.dataset['360']
        if (photo360Url) {
          open360Viewer(photo360Url, item.querySelector('.portfolio-title').textContent)
        }
      })
    })
}

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link, .back-to-top')

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href')
      if (href && href.startsWith('#')) {
        e.preventDefault()
        const targetId = href.substring(1)
        const targetElement = targetId === 'home' ?
          document.body :
          document.getElementById(targetId)

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' })
        }
      }
    })
  })

  window.addEventListener('scroll', () => {
    const header = document.querySelector('.header')
    if (window.scrollY > 100) {
      header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)'
    } else {
      header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'
    }
  })
}

function openVideoViewer(vimeoUrl, title) {
  const vimeoId = extractVimeoId(vimeoUrl)
  if (!vimeoId) {
    console.error('Invalid Vimeo URL:', vimeoUrl)
    return
  }

  const modal = document.createElement('div')
  modal.className = 'video-viewer-modal'
  modal.innerHTML = `
    <div class="video-viewer-content">
      <button class="video-viewer-close">&times;</button>
      <h3 class="video-viewer-title">${title}</h3>
      <div class="video-viewer-iframe-wrapper">
        <iframe
          src="https://player.vimeo.com/video/${vimeoId}?autoplay=1&color=ff6b35&title=0&byline=0&portrait=0"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
          class="video-viewer-iframe">
        </iframe>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  const closeBtn = modal.querySelector('.video-viewer-close')
  closeBtn.addEventListener('click', () => {
    modal.remove()
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove()
    }
  })

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      modal.remove()
      document.removeEventListener('keydown', escHandler)
    }
  })
}

function extractVimeoId(url) {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

function loadPannellum() {
  return new Promise((resolve, reject) => {
    if (typeof pannellum !== 'undefined') {
      resolve()
      return
    }

    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css'
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function open360Viewer(imageUrl, title) {
  // Lazy load pannellum if not already loaded
  if (typeof pannellum === 'undefined') {
    await loadPannellum()
  }

  const modal = document.createElement('div')
  modal.className = 'viewer-360-modal'
  modal.innerHTML = `
    <div class="viewer-360-content">
      <button class="viewer-360-close">&times;</button>
      <h3 class="viewer-360-title">${title}</h3>
      <div id="panorama" class="viewer-360-panorama"></div>
    </div>
  `

  document.body.appendChild(modal)

  const viewer = pannellum.viewer('panorama', {
    type: 'equirectangular',
    panorama: imageUrl,
    autoLoad: true,
    showControls: true,
    compass: true,
    northOffset: 0,
    hotSpotDebug: false
  })

  const closeBtn = modal.querySelector('.viewer-360-close')
  closeBtn.addEventListener('click', () => {
    viewer.destroy()
    modal.remove()
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      viewer.destroy()
      modal.remove()
    }
  })

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      viewer.destroy()
      modal.remove()
      document.removeEventListener('keydown', escHandler)
    }
  })
}

async function setupContactForm() {
  const form = document.getElementById('contact-form')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const submitButton = form.querySelector('button[type="submit"]')
    const originalButtonText = submitButton.textContent
    submitButton.textContent = 'Verzenden...'
    submitButton.disabled = true

    const formData = new FormData(form)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message')
    }

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([data])

      if (error) throw error

      alert('Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.')
      form.reset()
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Er is een fout opgetreden bij het verzenden. Probeer het later opnieuw.')
    } finally {
      submitButton.textContent = originalButtonText
      submitButton.disabled = false
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  loadPortfolioItems()
  setupNavigation()
  setupContactForm()
})
