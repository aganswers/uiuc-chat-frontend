/**
 * Test page for ADK streaming integration
 */
import { GetServerSideProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { Container, Title, Text, Stack } from '@mantine/core'
import { ADKChatTest } from '@/components/Chat/ADKChatTest'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

export default function ADKTestPage() {
  return (
    <Container size="md" py="xl" className={montserrat_paragraph.className}>
      <Stack>
        <div className={montserrat_heading.className}>
          <Title order={1} ta="center" mb="sm">
            ADK Streaming Test
          </Title>
          <Text ta="center" c="dimmed" size="lg">
            Test the new ADK-powered chat streaming with real-time tool transparency
          </Text>
        </div>

        <ADKChatTest courseName="test-course" />

        <Text size="sm" c="dimmed" ta="center">
          This page tests the new ADK streaming integration. 
          Messages are sent directly to the /Chat endpoint with Server-Sent Events.
        </Text>
      </Stack>
    </Container>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'chat'])),
    },
  }
}
