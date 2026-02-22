"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Clock, Film, TrendingUp, Calendar } from "lucide-react"

// Mock data for demonstration
const mockViewingHistory = [
  { id: 1, title: "Stranger Things", date: "2023-04-20", duration: 55, genre: "Sci-Fi" },
  { id: 2, title: "The Queen's Gambit", date: "2023-04-18", duration: 60, genre: "Drama" },
  { id: 3, title: "Breaking Bad", date: "2023-04-15", duration: 48, genre: "Crime" },
  { id: 4, title: "The Crown", date: "2023-04-12", duration: 58, genre: "Drama" },
  { id: 5, title: "Ozark", date: "2023-04-10", duration: 60, genre: "Crime" },
  { id: 6, title: "The Witcher", date: "2023-04-08", duration: 60, genre: "Fantasy" },
  { id: 7, title: "Money Heist", date: "2023-04-05", duration: 50, genre: "Crime" },
  { id: 8, title: "Dark", date: "2023-04-03", duration: 60, genre: "Sci-Fi" },
  { id: 9, title: "The Mandalorian", date: "2023-04-01", duration: 40, genre: "Sci-Fi" },
  { id: 10, title: "Bridgerton", date: "2023-03-28", duration: 60, genre: "Romance" },
  { id: 11, title: "The Boys", date: "2023-03-25", duration: 60, genre: "Action" },
  { id: 12, title: "Squid Game", date: "2023-03-20", duration: 55, genre: "Thriller" },
  { id: 13, title: "Ted Lasso", date: "2023-03-15", duration: 30, genre: "Comedy" },
  { id: 14, title: "The Last of Us", date: "2023-03-10", duration: 60, genre: "Drama" },
  { id: 15, title: "Wednesday", date: "2023-03-05", duration: 45, genre: "Fantasy" },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B", "#6B66FF"]

export default function ViewingAnalytics() {
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [genreData, setGenreData] = useState<any[]>([])
  const [timeOfDayData, setTimeOfDayData] = useState<any[]>([])

  useEffect(() => {
    // Process data for weekly viewing
    const weeklyViewingMap = new Map()
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    days.forEach((day) => {
      weeklyViewingMap.set(day, 0)
    })

    mockViewingHistory.forEach((item) => {
      const date = new Date(item.date)
      const day = days[date.getDay()]
      weeklyViewingMap.set(day, weeklyViewingMap.get(day) + item.duration)
    })

    const weeklyDataArray = Array.from(weeklyViewingMap).map(([name, value]) => ({ name, value }))
    // Reorder to start with Monday
    const mondayIndex = weeklyDataArray.findIndex((item) => item.name === "Monday")
    const reorderedWeeklyData = [...weeklyDataArray.slice(mondayIndex), ...weeklyDataArray.slice(0, mondayIndex)]
    setWeeklyData(reorderedWeeklyData)

    // Process data for genre distribution
    const genreMap = new Map()
    mockViewingHistory.forEach((item) => {
      genreMap.set(item.genre, (genreMap.get(item.genre) || 0) + 1)
    })

    const genreDataArray = Array.from(genreMap).map(([name, value]) => ({ name, value }))
    setGenreData(genreDataArray)

    // Mock data for time of day viewing
    setTimeOfDayData([
      { name: "Morning (6AM-12PM)", value: 15 },
      { name: "Afternoon (12PM-6PM)", value: 20 },
      { name: "Evening (6PM-10PM)", value: 45 },
      { name: "Night (10PM-6AM)", value: 20 },
    ])
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow-sm">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-sm">{`${payload[0].value} minutes`}</p>
        </div>
      )
    }
    return null
  }

  const PieCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow-sm">
          <p className="font-medium">{`${payload[0].name}`}</p>
          <p className="text-sm">{`${payload[0].value} ${payload[0].name.includes("minutes") ? "" : "shows/movies"}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Viewing Analytics
        </CardTitle>
        <CardDescription>Insights into your Netflix viewing habits</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="weekly">Weekly Patterns</TabsTrigger>
            <TabsTrigger value="genres">Genre Preferences</TabsTrigger>
            <TabsTrigger value="time">Time of Day</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Weekly Viewing Pattern</h3>
              </div>
              <p className="text-sm text-muted-foreground">See which days of the week you watch the most content.</p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-muted-foreground text-center mt-2">
                You watch the most content on{" "}
                {weeklyData.reduce((max, item) => (max.value > item.value ? max : item), { value: 0 }).name}s.
              </div>
            </div>
          </TabsContent>

          <TabsContent value="genres">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Genre Preferences</h3>
              </div>
              <p className="text-sm text-muted-foreground">Your most-watched genres based on viewing history.</p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieCustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-muted-foreground text-center mt-2">
                Your top genre is{" "}
                {genreData.reduce((max, item) => (max.value > item.value ? max : item), { value: 0 }).name}.
              </div>
            </div>
          </TabsContent>

          <TabsContent value="time">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Time of Day Viewing</h3>
              </div>
              <p className="text-sm text-muted-foreground">When you typically watch content throughout the day.</p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={timeOfDayData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {timeOfDayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieCustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-muted-foreground text-center mt-2">
                You prefer watching during the{" "}
                {
                  timeOfDayData
                    .reduce((max, item) => (max.value > item.value ? max : item), { value: 0 })
                    .name.split(" ")[0]
                }
                .
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
