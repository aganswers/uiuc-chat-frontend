import Head from 'next/head'
import React, { useEffect, useState } from 'react'
import Navbar from './navbars/Navbar'
import { useMediaQuery } from '@mantine/hooks'
import router from 'next/router'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import createProject from '~/pages/api/UIUC-api/createProject'
import ProjectTable from './ProjectTable'
import { IconPlus, IconX, IconCheck } from '@tabler/icons-react'

const ProjectsPage = ({
  project_name,
  current_user_email,
  is_new_course = true,
  project_description,
}: {
  project_name: string
  current_user_email: string
  is_new_course?: boolean
  project_description?: string
}) => {
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [projectName, setProjectName] = useState(project_name || '')
  const [projectDescription, setProjectDescription] = useState(project_description || '')
  const [isCourseAvailable, setIsCourseAvailable] = useState<boolean | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [allExistingCourseNames, setAllExistingCourseNames] = useState<string[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  const checkCourseAvailability = () => {
    const courseExists =
      projectName != '' &&
      allExistingCourseNames &&
      allExistingCourseNames.includes(projectName)
    setIsCourseAvailable(!courseExists)
  }

  const checkIfNewCoursePage = () => {
    return router.asPath.split('/')[1]?.split('?')[0] as string
  }

  useEffect(() => {
    if (checkIfNewCoursePage() == 'new') {
      async function fetchgetallCourseNames() {
        const response = await fetch(`/api/UIUC-api/getAllCourseNames`)

        if (response.ok) {
          const data = await response.json()
          setAllExistingCourseNames(data.all_course_names)
        } else {
          console.error(`Error fetching course metadata: ${response.status}`)
        }
      }

      fetchgetallCourseNames().catch((error) => {
        console.error(error)
      })
    }
  }, [])

  useEffect(() => {
    checkCourseAvailability()
  }, [projectName, allExistingCourseNames])

  const handleSubmit = async (
    project_name: string,
    project_description: string | undefined,
    current_user_email: string,
  ) => {
    setIsLoading(true)
    try {
      const result = await createProject(
        project_name,
        project_description,
        current_user_email,
      )
      console.log('Project created successfully:', result)
      if (is_new_course) {
        await router.push(`/${projectName}/dashboard`)
        return
      }
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setProjectName('')
    setProjectDescription('')
    setShowCreateForm(false)
  }

  return (
    <>
      <Navbar isPlain={true} />
      <Head>
        <title>Projects - UIUC.chat</title>
        <meta name="description" content="Manage your AI-powered agricultural projects" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className={`text-4xl md:text-5xl font-bold text-gray-900 mb-4 ${montserrat_heading.variable} font-montserratHeading`}>
              Your Projects
            </h1>
            <p className="text-gray-700 text-lg max-w-2xl mx-auto mb-8">
              Manage and create AI-powered agricultural projects to enhance your farming operations
            </p>
            
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-orange-500/25 transform hover:scale-105"
              >
                <IconPlus size={20} className="mr-2" />
                Create New Project
              </button>
            )}
          </div>

          {/* Create Project Form */}
          {showCreateForm && (
            <div className="mb-12">
              <div className="max-w-2xl mx-auto bg-white backdrop-blur-sm rounded-xl border border-gray-200 p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
                  <button
                    onClick={resetForm}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <IconX size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <div className="relative">
                      <input
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        type="text"
                        value={projectName}
                        onChange={(e) => {
                          // Replace spaces with dashes and allow only letters, numbers, and dashes
                          const sanitized = e.target.value
                            .replace(/\s+/g, '-')
                            .replace(/[^a-zA-Z0-9-]/g, '');
                          setProjectName(sanitized);
                        }}
                        placeholder="my-agriculture-project"
                        disabled={!is_new_course}
                        autoFocus
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                          isCourseAvailable && projectName !== ''
                            ? 'border-green-600 bg-green-50'
                            : projectName !== '' && !isCourseAvailable
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {projectName !== '' && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {isCourseAvailable ? (
                            <IconCheck size={20} className="text-green-600" />
                          ) : (
                            <IconX size={20} className="text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-500 font-normal ml-1 text-sm">We only allow letters, numbers, and dashes in the project name.</span>
                    {projectName !== '' && !isCourseAvailable && (
                      <p className="mt-2 text-sm text-red-600">
                        Project name already exists
                      </p>
                    )}
                    {projectName !== '' && isCourseAvailable && (
                      <p className="mt-2 text-sm text-green-600">
                        Project name available
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Description
                      <span className="text-gray-500 font-normal ml-1">(optional)</span>
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Describe your project goals, expected impact, or specific agricultural focus..."
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-gray-400 transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={async () => {
                        await handleSubmit(
                          projectName,
                          projectDescription,
                          current_user_email,
                        )
                      }}
                      disabled={projectName === '' || !isCourseAvailable || isLoading}
                      className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                        projectName !== '' && isCourseAvailable && !isLoading
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/25 transform hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Creating...
                        </div>
                      ) : (
                        'Create Project'
                      )}
                    </button>
                    
                    <button
                      onClick={resetForm}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {projectName !== '' && isCourseAvailable && (
                    <p className="text-center text-sm text-gray-600">
                      Next: Upload documents and configure your AI assistant
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Projects Table */}
          <div className="max-w-6xl mx-auto">
            <ProjectTable />
          </div>
        </div>
      </main>
    </>
  )
}

export default ProjectsPage
