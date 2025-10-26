import './style.css'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function loadPortfolioItems() {
  const portfolioGrid = document.getElementById('portfolio-grid')

  try {
    const { data: items, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('is_visible', true)
      .order('order_index', { ascending: true })

    if (error) throw error

    if (!items || items.length === 0) {
      portfolioGrid.innerHTML = '<p style="color: var(--color-text-muted); grid-column: 1 / -1; text-align: center; padding: 3rem;">Binnenkort beschikbaar...</p>'
      return
    }

    portfolioGrid.innerHTML = items.map(item => {
      const hasVideo = item.vimeo_url
      const playIconHtml = hasVideo ? `
        <div class="portfolio-play-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      ` : ''

      return `
        <div class="portfolio-item" data-id="${item.id}" ${hasVideo ? `data-vimeo="${item.vimeo_url}"` : ''}>
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" />` : ''}
          ${playIconHtml}
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
        if (vimeoUrl) {
          window.open(vimeoUrl, '_blank')
        }
      })
    })

  } catch (error) {
    console.error('Error loading portfolio items:', error)
    portfolioGrid.innerHTML = '<p style="color: var(--color-text-muted); grid-column: 1 / -1; text-align: center; padding: 3rem;">Portfolio items laden mislukt.</p>'
  }
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
      header.style.backgroundColor = 'rgba(26, 26, 26, 0.98)'
    } else {
      header.style.backgroundColor = 'rgba(26, 26, 26, 0.95)'
    }
  })
}

function setupContactForm() {
  const form = document.getElementById('contact-form')

  form.addEventListener('submit', (e) => {
    e.preventDefault()

    const formData = new FormData(form)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message')
    }

    console.log('Form submitted:', data)

    alert('Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.')
    form.reset()
  })
}

document.addEventListener('DOMContentLoaded', () => {
  loadPortfolioItems()
  setupNavigation()
  setupContactForm()
})
