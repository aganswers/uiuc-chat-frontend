// src/components/UIUC-Components/ConversationsPerDayOfWeekChart.tsx
import React, { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import axios from 'axios'
import { Text, Title } from '@mantine/core'
import { LoadingSpinner } from './LoadingSpinner'
import { montserrat_paragraph } from 'fonts'

interface ChartProps {
  data?: { [day: string]: number }
  isLoading: boolean
  error: string | null
}

const ConversationsPerDayOfWeekChart: React.FC<ChartProps> = ({
  data,
  isLoading,
  error,
}) => {
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]

  const getYAxisLabelPadding = (data: { count: number }[]) => {
    const maxValue = Math.max(...data.map((item) => item.count))
    const digits = maxValue.toString().length
    return -(10 + (digits - 1) * 5)
  }

  if (isLoading) {
    return (
      <Text>
        Loading chart <LoadingSpinner size="xs" />
      </Text>
    )
  }

  if (error) {
    return <Text color="red">{error}</Text>
  }

  if (!data) {
    return <Text>No data available</Text>
  }

  const chartData = daysOfWeek.map((day) => ({
    day,
    count: data[day] || 0,
  }))

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3a4a" />
          <XAxis
            dataKey="day"
            tick={{
              fill: '#fff',
              fontFamily: montserrat_paragraph.style.fontFamily,
            }}
            label={{
              value: 'Day of Week',
              position: 'insideBottom',
              offset: -5,
              fill: '#fff',
              fontFamily: montserrat_paragraph.style.fontFamily,
              dy: 5,
            }}
          />
          <YAxis
            allowDecimals={false}
            tick={{
              fill: '#fff',
              fontFamily: montserrat_paragraph.style.fontFamily,
            }}
            label={{
              value: 'Number of Conversations',
              angle: -90,
              position: 'center',
              fill: '#fff',
              fontFamily: montserrat_paragraph.style.fontFamily,
              dx: getYAxisLabelPadding(chartData),
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#15162c',
              borderColor: '#3a3a4a',
              color: '#fff',
              fontFamily: montserrat_paragraph.style.fontFamily,
            }}
            formatter={(value) => [`Conversations: ${value}`]}
            labelFormatter={(label) => `Day of Week: ${label}`}
          />
          <Bar dataKey="count" fill="#7e57c2" name="Number of Conversations" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ConversationsPerDayOfWeekChart
