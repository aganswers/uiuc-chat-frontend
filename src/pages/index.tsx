import Image from 'next/image'
import { type NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React, { useState } from 'react'

import {
  // MantineProvider,
  rem,
  Card,
  Text,
  Title,
  Badge,
  Button,
  Group,
  Flex,
  Container,
} from '@mantine/core'

import { LandingPageHeader } from '~/components/UIUC-Components/navbars/GlobalHeader'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

const Home: NextPage = () => {
  const [email, setEmail] = useState('')
  const [activeCarouselTab, setActiveCarouselTab] = useState(0)
  const [openAccordion, setOpenAccordion] = useState(-1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Email submitted:', email)
    window.open(
      'mailto:aganswersai@gmail.com?subject=Demo Request&body=I would like to schedule a demo of AgAnswers.ai. My email is ' +
        email,
      '_blank',
    )
    // You can add your form submission logic here
  }

  // Sample data for the landing page
  const credibilityPartners = [
    'University of Illinois',
    'USDA Extension',
    'AgTech Partners',
    'Farm Bureau',
    'Crop Science Society',
  ]

  const carouselTabs = ['Deploy', 'Dashboard', 'Chat']

  const carouselContent = {
    Deploy:
      'Get your AI solution up and running in under 60 seconds with our automated deployment system.',
    Dashboard:
      'Monitor performance, manage users, and track analytics from your centralized dashboard.',
    Chat: 'Engage with intelligent AI assistants trained on your agricultural data and workflows.',
  }

  const featureAccordion = [
    {
      title: 'Intelligent Document Processing',
      content:
        'Upload research papers, farm reports, regulatory documents, and technical manuals. Our AI instantly understands and can answer questions from your entire knowledge base.',
      features: [
        'PDF & Document Analysis',
        'Research Paper Integration',
        'Regulatory Compliance',
      ],
      link: 'Explore document AI →',
    },
    {
      title: 'Agricultural Data Analysis',
      content:
        'Connect satellite imagery, sensor data, weather information, and crop monitoring systems. Get insights and recommendations powered by comprehensive agricultural intelligence.',
      features: [
        'Satellite Integration',
        'IoT Sensor Data',
        'Weather Analytics',
      ],
      link: 'See data capabilities →',
    },
    {
      title: 'Custom AI Agents',
      content:
        'Deploy specialized AI agents for crop advisory, equipment maintenance, supply chain optimization, and regulatory compliance tailored to your specific operations.',
      features: [
        'Crop Advisory Bots',
        'Equipment Monitoring',
        'Supply Chain AI',
      ],
      link: 'Build custom agents →',
    },
  ]
  return (
    <>
      <Head>
        <title>AgAnswers</title>
        <meta
          name="description"
          content="Chat with your documents, with full support for any format and web scraping."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LandingPageHeader />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="via-orange-25 relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-orange-50 to-white px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900/5 via-orange-800/5 to-transparent"></div>

          <div className="relative z-10 mx-auto mt-80 max-w-5xl pt-20 text-center">
            <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 md:text-6xl lg:text-7xl">
              Build and deploy AI solutions for{' '}
              <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                sustainable production agriculture
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-gray-600 md:text-2xl">
              Deploy intelligent chatbots, custom AI tools, and autonomous
              agents tailored to your agricultural operations in minutes, not
              months.
            </p>

            {/* CTA Form */}
            <div className="mb-12 flex flex-col items-center justify-center gap-4 md:flex-row">
              <form
                onSubmit={handleSubmit}
                className="flex w-full max-w-md flex-col gap-4 md:flex-row"
              >
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none focus:border-transparent focus:ring-2 focus:ring-orange-500"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-orange-600"
                >
                  Schedule a Demo
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Credibility Section */}
        <section className="border-b border-gray-200 py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-500">
                Trusted by agricultural leaders
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              {credibilityPartners.map((partner, index) => (
                <div key={index} className="text-lg font-medium text-gray-500">
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hero Carousel */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-xl border border-gray-700 bg-gray-900/90 p-8 backdrop-blur-sm">
              <div className="relative mb-6">
                <div
                  className={`flex items-center justify-center rounded-lg border border-gray-600 bg-gradient-to-br from-gray-800 to-gray-900 ${activeCarouselTab === 0 ? 'aspect-video' : ''}`}
                >
                  {activeCarouselTab === 0 && (
                    <video
                      src="/media/landing/spinup.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full rounded-lg object-cover"
                    />
                  )}
                  {activeCarouselTab === 2 && (
                    <img
                      src="/media/landing/chat.jpeg"
                      className="h-full w-full rounded-lg object-cover"
                    />
                  )}
                  {activeCarouselTab === 1 && (
                    <img
                      src="/media/landing/dashboard.jpeg"
                      className="h-full w-full rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="mb-4 flex justify-center">
                <div className="flex rounded-full bg-gray-800 p-1">
                  {carouselTabs.map((tab, index) => (
                    <button
                      key={tab}
                      onClick={() => setActiveCarouselTab(index)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
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
                {
                  carouselContent[
                    carouselTabs[
                      activeCarouselTab
                    ] as keyof typeof carouselContent
                  ]
                }
              </p>
            </div>
          </div>
        </section>

        {/* Main Features Section */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
                Transform your agricultural operations
              </h2>
              <p className="mx-auto max-w-3xl text-xl text-gray-600">
                With AI embedded throughout your workflows, you can automate
                tasks, analyze data, and improve decision-making across your
                entire operation.
              </p>
            </div>

            <div className="grid items-start gap-12 lg:grid-cols-2">
              {/* Demo video */}
              <div className="sticky top-8 rounded-xl border border-gray-200 bg-gray-100 p-8">
                <div className="mb-6 flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                  <video
                    src="/media/landing/spinup.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full rounded-lg object-cover"
                    style={
                      {
                        imageRendering: 'crisp-edges',
                      } as React.CSSProperties
                    }
                  />
                </div>
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    See AgAnswers.ai in action
                  </h3>
                  <p className="text-sm text-gray-600">
                    Watch how our AI solutions integrate with agricultural
                    workflows
                  </p>
                </div>
              </div>

              {/* Accordion */}
              <div className="space-y-4">
                {featureAccordion.map((item, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    <button
                      onClick={() =>
                        setOpenAccordion(openAccordion === index ? -1 : index)
                      }
                      className="z-0 flex w-full items-center justify-between px-6 py-6 text-left transition-colors hover:bg-gray-50"
                    >
                      <h3 className="text-xl font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <svg
                        className={`h-6 w-6 text-gray-400 transition-transform ${openAccordion === index ? 'rotate-45' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </button>
                    {openAccordion === index && (
                      <div className="px-6 pb-6">
                        <p className="mb-6 text-lg leading-relaxed text-gray-600">
                          {item.content}
                        </p>

                        <div className="mb-6 grid gap-4 md:grid-cols-3">
                          {item.features.map((feature, featureIndex) => (
                            <div
                              key={featureIndex}
                              className="flex items-center space-x-3"
                            >
                              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                              <span className="text-sm text-gray-700">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>

                        <Link
                          href="#"
                          className="inline-flex items-center font-medium text-orange-600 hover:text-orange-700"
                        >
                          {item.link}
                          <svg
                            className="ml-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
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
        <section className="bg-gradient-to-b from-orange-50/50 to-transparent px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
                Built for agricultural excellence
              </h2>
              <p className="mx-auto max-w-3xl text-xl text-gray-600">
                Our AI solutions are specifically designed for the unique
                challenges and opportunities in modern agriculture.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  title: 'Document Intelligence',
                  description:
                    'Upload research papers, reports, manuals, and datasets. Get instant answers from your knowledge base.',
                  link: 'Explore document AI',
                },
                {
                  title: 'Multimodal Analysis',
                  description:
                    'Analyze satellite imagery, crop photos, sensor data, and more through conversational AI interfaces.',
                  link: 'Learn about analysis tools',
                },
                {
                  title: 'Custom Integration',
                  description:
                    'Connect with your existing systems, databases, and workflows. Tailored solutions for your specific needs.',
                  link: 'See integration options',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
                >
                  <h3 className="mb-4 text-xl font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mb-6 leading-relaxed text-gray-600">
                    {item.description}
                  </p>
                  <Link
                    href="#"
                    className="inline-flex items-center font-medium text-orange-600 hover:text-orange-700"
                  >
                    {item.link}
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gray-900 px-4 py-20 text-center">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">
              Ready to transform your agricultural operations?
            </h2>
            <p className="mb-12 text-xl text-gray-300">
              Join forward-thinking agricultural companies using AI to optimize
              their operations, increase efficiency, and drive innovation.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 md:flex-row"
              >
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border-0 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-600"
                >
                  Schedule a Demo
                </button>
              </form>
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
              Aidan Andrews, Kastan Day, Rohan Marwaha, Aditya Sengupta, and
              Vikram Adve
            </Text>
          </div>
        </Container>
      </main>
    </>
  )
}

export default Home
