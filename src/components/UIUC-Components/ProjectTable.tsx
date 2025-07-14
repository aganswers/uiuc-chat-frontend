import { Table, Title, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useRouter } from 'next/router'
import { montserrat_heading } from 'fonts'
import Link from 'next/link'
import React from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { IconChevronUp, IconChevronDown, IconSelector, IconPlus } from '@tabler/icons-react'

type SortDirection = 'asc' | 'desc' | null;
type SortableColumn = 'name' | 'privacy' | 'owner' | 'admins';

const ProjectTable: React.FC = () => {
  const clerk_user = useUser()
  const [courses, setProjects] = useState<{ [key: string]: CourseMetadata }[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [rows, setRows] = useState<JSX.Element[]>([])
  const [isFullyLoaded, setIsFullyLoaded] = useState<boolean>(false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [sortColumn, setSortColumn] = useState<SortableColumn>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [rawData, setRawData] = useState<{ [key: string]: CourseMetadata }[]>([])

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) return <IconSelector size={16} className="text-gray-500" />;
    return sortDirection === 'asc' ? 
      <IconChevronUp size={16} className="text-orange-500" /> : 
      <IconChevronDown size={16} className="text-orange-500" />;
  }

  const sortData = () => {
    if (!rawData) return;

    const sortedData = [...rawData].sort((a, b) => {
      const courseNameA = Object.keys(a)[0] ?? '';
      const courseNameB = Object.keys(b)[0] ?? '';
      const metadataA = a[courseNameA as keyof typeof a];
      const metadataB = b[courseNameB as keyof typeof b];

      if (!metadataA || !metadataB) return 0;

      let comparison = 0;
      switch (sortColumn) {
        case 'name':
          comparison = courseNameA.toLowerCase().localeCompare(courseNameB.toLowerCase());
          break;
        case 'privacy':
          comparison = (metadataA.is_private === metadataB.is_private) ? 0 : metadataA.is_private ? 1 : -1;
          break;
        case 'owner':
          comparison = metadataA.course_owner.toLowerCase().localeCompare(metadataB.course_owner.toLowerCase());
          break;
        case 'admins':
          const adminsA = metadataA.course_admins.filter((admin: string) => admin !== 'kvday2@illinois.edu').join(', ');
          const adminsB = metadataB.course_admins.filter((admin: string) => admin !== 'kvday2@illinois.edu').join(', ');
          comparison = adminsA.toLowerCase().localeCompare(adminsB.toLowerCase());
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    const newRows = sortedData
      .map((course) => {
        const courseName = Object.keys(course)[0];
        if (!courseName) return null;
        
        const courseMetadata = course[courseName as keyof typeof course];
        if (!courseMetadata) return null;

        const filteredAdmins = courseMetadata.course_admins.filter(
          (admin: string) => admin !== 'kvday2@illinois.edu'
        );
        
        return (
          <tr
            key={courseName}
            onClick={() => router.push(`/${courseName}/chat`)}
            className="group cursor-pointer border-b border-gray-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent transition-all duration-200"
          >
            <td className="px-6 py-4">
              <div className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                {courseName}
              </div>
            </td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                courseMetadata.is_private 
                  ? 'bg-red-100 text-red-800 border border-red-200' 
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {courseMetadata.is_private ? 'Private' : 'Public'}
              </span>
            </td>
            <td className="px-6 py-4 text-gray-700">
              {courseMetadata.course_owner}
            </td>
            <td className="px-6 py-4 text-gray-700">
              <div className="max-w-xs truncate">
                {filteredAdmins.length > 0 ? filteredAdmins.join(', ') : '—'}
              </div>
            </td>
          </tr>
        );
      })
      .filter((row): row is JSX.Element => row !== null);

    setRows(newRows);
  }

  useEffect(() => {
    sortData();
  }, [sortColumn, sortDirection, rawData]);

  useEffect(() => {
    const fetchCourses = async () => {
      console.log('Fetching projects')
      if (!clerk_user.isLoaded) {
        return
      }

      if (clerk_user.isSignedIn) {
        console.log('Signed')
        const emails = extractEmailsFromClerk(clerk_user.user as any)
        const currUserEmail = emails[0]
        console.log(currUserEmail)
        if (!currUserEmail) {
          throw new Error('No email found for the user')
        }

        const response = await fetch(
          `/api/UIUC-api/getAllCourseMetadata?currUserEmail=${currUserEmail}`,
        )
        const data = await response.json()
        if (data) {
          setRawData(data);
          setIsFullyLoaded(true)
        } else {
          console.log('No project found with the given name')
          setIsFullyLoaded(true)
        }
      } else {
        console.log('User not signed in')
        setIsFullyLoaded(true)
      }
    }
    fetchCourses()
  }, [clerk_user.isLoaded, clerk_user.isSignedIn])

  if (!clerk_user.isLoaded || !isFullyLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!clerk_user.isSignedIn) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">Sign in to view your projects</div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <IconPlus size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first AI-powered agricultural project to get started
          </p>
        </div>
        <Link 
          href="/new"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-orange-500/25"
        >
          <IconPlus size={20} className="mr-2" />
          Create Project
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { label: 'Project Name', key: 'name' },
                  { label: 'Privacy', key: 'privacy' },
                  { label: 'Owner', key: 'owner' },
                  { label: 'Admins', key: 'admins' }
                ].map(({ label, key }) => (
                  <th 
                    key={key} 
                    onClick={() => handleSort(key as SortableColumn)}
                    className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`${montserrat_heading.variable} font-montserratHeading`}>
                        {label}
                      </span>
                      {getSortIcon(key as SortableColumn)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ProjectTable
