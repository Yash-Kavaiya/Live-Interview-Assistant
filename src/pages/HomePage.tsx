import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Video, Mic, Brain, ArrowRight, Star, Users, Trophy, TrendingUp, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

function HomePage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')

  const handleStartInterview = () => {
    if (selectedRole && selectedDifficulty) {
      navigate(`/interview?role=${selectedRole}&difficulty=${selectedDifficulty}`)
    }
  }

  const interviewTypes = [
    { value: 'software-engineer', label: 'Software Engineer', icon: '💻' },
    { value: 'data-scientist', label: 'Data Scientist', icon: '📊' },
    { value: 'product-manager', label: 'Product Manager', icon: '🚀' },
    { value: 'marketing-manager', label: 'Marketing Manager', icon: '📈' },
    { value: 'sales-representative', label: 'Sales Representative', icon: '💼' },
    { value: 'business-analyst', label: 'Business Analyst', icon: '📋' },
  ]

  const difficultyLevels = [
    { value: 'entry', label: 'Entry Level', description: 'Perfect for recent graduates', color: 'bg-green-100 text-green-800' },
    { value: 'mid', label: 'Mid Level', description: '2-5 years of experience', color: 'bg-blue-100 text-blue-800' },
    { value: 'senior', label: 'Senior Level', description: '5+ years of experience', color: 'bg-purple-100 text-purple-800' },
    { value: 'executive', label: 'Executive', description: 'Leadership positions', color: 'bg-orange-100 text-orange-800' },
  ]

  const features = [
    { icon: Brain, title: 'AI-Powered Interviewer', description: 'Advanced AI conducts realistic interviews tailored to your role' },
    { icon: Video, title: 'Real-Time Video Analysis', description: 'Get instant feedback on your body language and presentation' },
    { icon: Monitor, title: 'Screen Sharing', description: 'Demonstrate coding skills and technical solutions in real-time' },
    { icon: TrendingUp, title: 'Performance Tracking', description: 'Monitor your progress and identify areas for improvement' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold">InterviewAce</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/test')}
              className="text-xs"
            >
              🧪 Debug
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              InterviewAce
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Master your next job interview with AI-powered practice sessions. 
            Build confidence, improve your skills, and land your dream job.
          </p>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">4.9</span>
              </div>
              <p className="text-sm text-muted-foreground">User Rating</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">50K+</span>
              </div>
              <p className="text-sm text-muted-foreground">Interviews Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Trophy className="w-5 h-5 text-secondary" />
                <span className="text-2xl font-bold">89%</span>
              </div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </div>

        {/* Interview Setup */}
        <Card className="max-w-2xl mx-auto mb-12 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Start Your Mock Interview</CardTitle>
            <p className="text-muted-foreground">Choose your role and experience level to begin</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-3 block">Select Interview Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose your target role" />
                </SelectTrigger>
                <SelectContent>
                  {interviewTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(selectedRole === 'software-engineer' || selectedRole === 'data-scientist') && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Monitor className="w-4 h-4" />
                    <span className="font-medium">Screen Sharing Available</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Demonstrate your coding skills by sharing your screen during technical questions
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Experience Level</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {difficultyLevels.map((level) => (
                  <Card 
                    key={level.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedDifficulty === level.value 
                        ? 'ring-2 ring-primary shadow-md' 
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedDifficulty(level.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{level.label}</h3>
                        <Badge className={level.color}>{level.value}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full h-12"
              onClick={handleStartInterview}
              disabled={!selectedRole || !selectedDifficulty}
            >
              Start Interview
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Ready to practice? Select your role and difficulty level above
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 bg-white/60 backdrop-blur-sm hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomePage 