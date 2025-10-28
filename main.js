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
        <div class="portfolio-item" data-id="${item.id}"
             data-title="${item.title}"
             data-category="${item.category || 'Project'}"
             data-description="${item.description || ''}"
             ${hasVideo ? `data-vimeo="${item.vimeo_url}"` : ''}
             ${has360Photo ? `data-360="${item.photo_360_url}"` : ''}
             ${thumbnailUrl ? `data-image="${thumbnailUrl}"` : ''}>
          ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="${item.title}" loading="lazy" decoding="async" />` : ''}
          ${playIconHtml}
          ${view360IconHtml}
          <div class="portfolio-overlay">
            <div>
              <span class="portfolio-category">${item.category || 'Project'}</span>
              <h3 class="portfolio-title">${item.title}</h3>
            </div>
          </div>
        </div>
      `
    }).join('')

    portfolioGrid.querySelectorAll('.portfolio-item').forEach(item => {
      item.addEventListener('click', () => {
        const hasVideo = item.dataset.vimeo
        const has360 = item.dataset['360']

        if (hasVideo) {
          openVideoViewer(item.dataset.vimeo, item.dataset.title)
        } else if (has360) {
          open360Viewer(item.dataset['360'], item.dataset.title)
        } else {
          openProjectDetail(item)
        }
      })
    })
}

function openProjectDetail(itemElement) {
  const modal = document.createElement('div')
  modal.className = 'project-detail-modal'

  const title = itemElement.dataset.title
  const category = itemElement.dataset.category
  const description = itemElement.dataset.description
  const imageUrl = itemElement.dataset.image

  modal.innerHTML = `
    <div class="project-detail-content">
      <button class="project-detail-close">&times;</button>
      <div class="project-detail-image">
        ${imageUrl ? `<img src="${imageUrl}" alt="${title}" />` : ''}
      </div>
      <div class="project-detail-info">
        <span class="project-detail-category">${category}</span>
        <h2 class="project-detail-title">${title}</h2>
        ${description ? `<p class="project-detail-description">${description}</p>` : ''}
        <a href="#contact" class="btn btn-primary" onclick="document.querySelector('.project-detail-modal').remove()">Start Vergelijkbaar Project</a>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  setTimeout(() => modal.classList.add('show'), 10)

  const closeBtn = modal.querySelector('.project-detail-close')
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('show')
    setTimeout(() => modal.remove(), 300)
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show')
      setTimeout(() => modal.remove(), 300)
    }
  })

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      modal.classList.remove('show')
      setTimeout(() => modal.remove(), 300)
      document.removeEventListener('keydown', escHandler)
    }
  })
}

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link, .back-to-top')
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle')
  const nav = document.querySelector('.nav')

  // Mobile menu toggle
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenuToggle.classList.toggle('active')
      nav.classList.toggle('active')
    })
  }

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

        // Close mobile menu after clicking
        if (nav.classList.contains('active')) {
          nav.classList.remove('active')
          mobileMenuToggle.classList.remove('active')
        }
      }
    })
  })

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !mobileMenuToggle.contains(e.target) && nav.classList.contains('active')) {
      nav.classList.remove('active')
      mobileMenuToggle.classList.remove('active')
    }
  })

  window.addEventListener('scroll', () => {
    const header = document.querySelector('.header')
    if (window.scrollY > 100) {
      header.style.backgroundColor = 'rgba(250, 250, 249, 0.98)'
    } else {
      header.style.backgroundColor = 'rgba(250, 250, 249, 0.95)'
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

function showNotification(message, type = 'success') {
  const notification = document.createElement('div')
  notification.className = `custom-notification custom-notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">
        ${type === 'success'
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
        }
      </div>
      <p class="notification-message">${message}</p>
      <button class="notification-close" aria-label="Sluiten">&times;</button>
    </div>
  `

  document.body.appendChild(notification)

  // Animate in
  setTimeout(() => notification.classList.add('show'), 10)

  // Close button handler
  const closeBtn = notification.querySelector('.notification-close')
  closeBtn.addEventListener('click', () => {
    notification.classList.remove('show')
    setTimeout(() => notification.remove(), 300)
  })

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show')
    setTimeout(() => notification.remove(), 300)
  }, 5000)
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

      showNotification('Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.', 'success')
      form.reset()
    } catch (error) {
      console.error('Error submitting form:', error)
      showNotification('Er is een fout opgetreden bij het verzenden. Probeer het later opnieuw.', 'error')
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
