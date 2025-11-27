import { NextRequest, NextResponse } from 'next/server'

// Mock task data
const mockTasks = [
  {
    id: '1',
    title: 'Plant a Tree in Central Park',
    description: 'Help make our city greener by planting a tree in Central Park. You\'ll need to take photos of the location before and after planting.',
    points: 50,
    category: 'Environment',
    difficulty: 1,
    estimatedTime: 30,
    location: {
      lat: 40.7829,
      lng: -73.9654
    },
    requirements: ['Photo of location before planting', 'Photo of tree after planting'],
    deadline: '2024-12-31',
    status: 'available'
  },
  {
    id: '2',
    title: 'Clean Community Garden',
    description: 'Help maintain our community garden by removing weeds and tidying up the area. Bring gloves and trash bags.',
    points: 30,
    category: 'Community',
    difficulty: 2,
    estimatedTime: 45,
    location: {
      lat: 40.7850,
      lng: -73.9680
    },
    requirements: ['Before and after photos', 'Completed checklist'],
    deadline: '2024-12-15',
    status: 'available'
  },
  {
    id: '3',
    title: 'Help at Food Bank',
    description: 'Assist with food distribution at the local food bank. Sorting donations and helping families.',
    points: 40,
    category: 'Community',
    difficulty: 2,
    estimatedTime: 60,
    location: {
      lat: 40.7880,
      lng: -73.9620
    },
    requirements: ['Photo of completed work', 'Volunteer hours log'],
    deadline: '2024-12-20',
    status: 'available'
  },
  {
    id: '4',
    title: 'Take Photos of Local Landmark',
    description: 'Document our city\'s history by taking clear photos of the historical town hall for the city archives.',
    points: 25,
    category: 'Photography',
    difficulty: 1,
    estimatedTime: 20,
    location: {
      lat: 40.7912,
      lng: -73.9695
    },
    requirements: ['Front exterior', 'Side views', 'Interior shots'],
    deadline: '2024-12-10',
    status: 'available'
  }
]

export async function GET(request: NextRequest) {
  const { category, min_points, max_points, difficulty, status } = request.query

  let filteredTasks = [...mockTasks]

  // Apply filters
  if (category) {
    filteredTasks = filteredTasks.filter(task =>
      task.category.toLowerCase().includes(category.toString().toLowerCase())
    )
  }

  if (min_points) {
    filteredTasks = filteredTasks.filter(task => task.points >= Number(min_points))
  }

  if (max_points) {
    filteredTasks = filteredTasks.filter(task => task.points <= Number(max_points))
  }

  if (difficulty) {
    filteredTasks = filteredTasks.filter(task => task.difficulty === Number(difficulty))
  }

  if (status) {
    filteredTasks = filteredTasks.filter(task => task.status === status)
  }

  return NextResponse.json({
    success: true,
    data: filteredTasks,
    pagination: {
      page: 1,
      limit: filteredTasks.length,
      total: filteredTasks.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, points, difficulty, location, requirements, deadline } = body

    // Create new task (in real app, this would save to database)
    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      category,
      points: Number(points),
      difficulty: Number(difficulty) || 1,
      location,
      requirements: requirements || [],
      deadline,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: newTask,
      message: 'Task created successfully!'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create task',
      status: 500
    })
  }
}