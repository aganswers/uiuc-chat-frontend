import Image from 'next/image'
import { type NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React, { useState } from 'react'

import {
  rem,
  Card,
  Text,
  Title,
  Container,
  SimpleGrid,
  Stack,
  Group,
} from '@mantine/core'

import { LandingPageHeader } from '~/components/UIUC-Components/navbars/GlobalHeader'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

const Home: NextPage = () => {
  const [openAccordion, setOpenAccordion] = useState(0)
  const [email, setEmail] = useState('')
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [activeCarouselTab, setActiveCarouselTab] = useState(0)

  const featureAccordion = [
    {
      title: 'Deploy chatbots in minutes',
      content: 'Upload your research papers, manuals, reports, and datasets. Get a fully functional chatbot that understands your proprietary knowledge with zero coding required.',
      link: 'Explore document chatbots',
      features: ['No-code deployment', 'Multi-format document support', 'Instant knowledge retrieval']
    },
    {
      title: 'Connect AI to your infrastructure',
      content: 'Build custom tools that integrate directly with your existing systems, databases, and workflows. Control equipment and manage operations through natural conversation.',
      link: 'Discover custom AI tools',
      features: ['Direct system integration', 'Real-time data access', 'Automated workflows']
    },
    {
      title: 'Autonomous AI agents',
      content: 'Deploy intelligent agents that analyze satellite imagery, process sensor data, and coordinate complex multi-step agricultural workflows without human intervention.',
      link: 'Learn about AI agents',
      features: ['Multimodal analysis', 'Autonomous decision making', 'Multi-agent coordination']
    },
    {
      title: 'Platform or managed service',
      content: 'Choose between self-service platform access or fully managed custom solutions tailored specifically to your agricultural operations.',
      link: 'Compare service options',
      features: ['Self-service platform', 'Custom development', 'Ongoing maintenance']
    }
  ]

  const credibilityPartners = [
    'University of Illinois', 'Nelson Farms', 'AIFARMS', 'NCSA', 'Agricultural Research'
  ]

  const carouselTabs = ['Instant Spin Up', 'Document Databases', 'Chat Interface']
  
  const carouselContent = {
    'Instant Spin Up': 'Deploy complete AI systems in minutes with zero configuration required.',
    'Document Databases': 'Upload any document format and create searchable knowledge bases instantly.',
    'Chat Interface': 'Interact with your agricultural data through natural conversation.'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = `mailto:aganswersai@gmail.com?subject=AgAnswers.ai Inquiry&body=Email: ${email}`
  }

  // Auto-rotate carousel
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveCarouselTab((prev) => (prev + 1) % carouselTabs.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeCarouselTab])

  return (
    <>
      <Head>
        <title>AgAnswers.ai - AI Solutions for Agriculture</title>
        <meta
          name="description"
          content="Fast, easy AI tools and services for industrial agriculture. Build chatbots, agents, and multimodal analysis solutions tailored to your needs."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LandingPageHeader />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-b from-purple-50 via-blue-50 to-white">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 via-blue-900/5 to-transparent"></div>
          
          <div className="relative z-10 text-center max-w-5xl mx-auto pt-20">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-gray-900">
              Build and deploy AI solutions for{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                industrial agriculture
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto">
              Deploy intelligent chatbots, custom AI tools, and autonomous agents 
              tailored to your agricultural operations in minutes, not months.
            </p>

            {/* CTA Form */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[hsl(280,100%,70%)] hover:bg-[hsl(280,100%,65%)] text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  Get Started
                </button>
              </form>
            </div>

            <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium">
              Schedule a Demo
            </button>
          </div>
        </section>

        {/* Credibility Section */}
        <section className="py-12 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-500">Trusted by agricultural leaders</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              {credibilityPartners.map((partner, index) => (
                <div key={index} className="text-gray-500 font-medium text-lg">
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hero Carousel */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
                <div className="relative mb-6">
                  <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border border-gray-600 ${activeCarouselTab === 0 ? 'aspect-video' : ''}`}>
                    {activeCarouselTab === 0 && (
                      <div className="text-center text-white p-8">
                        <div className="relative mb-6">
                          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="flex justify-center space-x-2 mb-4">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">AI System Deploying</h3>
                        <p className="text-gray-300 text-sm">Complete deployment in under 60 seconds</p>
                        <div className="mt-4 bg-gray-700/50 rounded-lg p-3">
                          <div className="text-xs text-gray-400 mb-1">Progress: 87%</div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full w-[87%] transition-all duration-300"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  {activeCarouselTab === 2 && (
                    <img src="/media/landing/chat.jpeg" className="w-full h-full object-cover rounded-lg" />
                  )}
                  {activeCarouselTab === 1 && (
                    <img src="/media/landing/dashboard.jpeg" className="w-full h-full object-cover rounded-lg" />
                  )}
                </div>
              </div>
              
              <div className="flex justify-center mb-4">
                <div className="flex bg-gray-800 rounded-full p-1">
                  {carouselTabs.map((tab, index) => (
                    <button
                      key={tab}
                      onClick={() => setActiveCarouselTab(index)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeCarouselTab === index 
                          ? 'bg-white text-black' 
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              
              <p className="text-center text-gray-300">
                {carouselContent[carouselTabs[activeCarouselTab] as keyof typeof carouselContent]}
              </p>
            </div>
          </div>
        </section>

        {/* Main Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Transform your agricultural operations
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                With AI embedded throughout your workflows, you can automate tasks, 
                analyze data, and improve decision-making across your entire operation.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Demo video */}
              <div className="bg-gray-100 rounded-xl p-8 border border-gray-200 sticky top-8">
                <div className="aspect-video bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-6">
                  <video 
                    src="/media/landing/demo.mp4" 
                    autoPlay 
                    muted 
                    loop 
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover rounded-lg"
                    style={{ 
                      imageRendering: 'crisp-edges'
                    } as React.CSSProperties}
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    See AgAnswers.ai in action
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Watch how our AI solutions integrate with agricultural workflows
                  </p>
                </div>
              </div>

              {/* Accordion */}
              <div className="space-y-4">
                {featureAccordion.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <button
                      onClick={() => setOpenAccordion(openAccordion === index ? -1 : index)}
                      className="w-full z-0 px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                      <svg 
                        className={`w-6 h-6 text-gray-400 transition-transform ${openAccordion === index ? 'rotate-45' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    {openAccordion === index && (
                      <div className="px-6 pb-6">
                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">{item.content}</p>
                        
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          {item.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-[hsl(280,100%,70%)] rounded-full flex-shrink-0"></div>
                              <span className="text-gray-700 text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Link 
                          href="#" 
                          className="inline-flex items-center text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,60%)] font-medium"
                        >
                          {item.link}
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Performance Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-blue-50/50 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Built for agricultural excellence
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our AI solutions are specifically designed for the unique challenges 
                and opportunities in modern agriculture.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Document Intelligence',
                  description: 'Upload research papers, reports, manuals, and datasets. Get instant answers from your knowledge base.',
                  link: 'Explore document AI'
                },
                {
                  title: 'Multimodal Analysis',
                  description: 'Analyze satellite imagery, crop photos, sensor data, and more through conversational AI interfaces.',
                  link: 'Learn about analysis tools'
                },
                {
                  title: 'Custom Integration',
                  description: 'Connect with your existing systems, databases, and workflows. Tailored solutions for your specific needs.',
                  link: 'See integration options'
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{item.description}</p>
                  <Link 
                    href="#" 
                    className="inline-flex items-center text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,60%)] font-medium"
                  >
                    {item.link}
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 text-center bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to transform your agricultural operations?
            </h2>
            <p className="text-xl text-gray-300 mb-12">
              Join forward-thinking agricultural companies using AI to optimize their operations, 
              increase efficiency, and drive innovation.
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-4 py-3 bg-white text-gray-900 rounded-lg border-0 focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[hsl(280,100%,70%)] hover:bg-[hsl(280,100%,65%)] text-white rounded-lg font-medium transition-colors"
                >
                  Get Started
                </button>
              </form>
              <button className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors text-white">
                Schedule a Demo
              </button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <Container size="lg" py={16}>
          <div className="text-center">
            <Text color="#9ca3af" size="md" weight={500} className="mb-2">
              Built by agricultural technology experts
            </Text>
            <Text color="#9ca3af" size="sm">
              Aidan Andrews, Kastan Day, Rohan Marwaha, Aditya Sengupta, and Vikram Adve
            </Text>
          </div>
        </Container>

        <GlobalFooter />
      </main>
    </>
  )
}

export default Home
