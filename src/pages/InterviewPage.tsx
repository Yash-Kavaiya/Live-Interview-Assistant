import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Settings, ArrowLeft, Clock, Brain, Pause, Play,
  MessageSquare, BarChart3, Monitor, MonitorOff,
  PictureInPicture, Maximize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { DevvAI } from '@devvai/devv-code-backend'

interface InterviewState {
  isActive: boolean
  isPaused: boolean
  currentQuestion: number
  totalQuestions: number
  timeElapsed: number
  videoEnabled: boolean
  audioEnabled: boolean
  screenSharing: boolean
  viewMode: 'camera' | 'screen' | 'split'  
}

function InterviewPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const screenRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [interviewState, setInterviewState] = useState<InterviewState>({
    isActive: false,
    isPaused: false,
    currentQuestion: 1,
    totalQuestions: 5,
    timeElapsed: 0,
    videoEnabled: true,
    audioEnabled: true,
    screenSharing: false,
    viewMode: 'camera'
  })
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  
  const role = searchParams.get('role') || 'software-engineer'
  const difficulty = searchParams.get('difficulty') || 'mid'
  
  const ai = new DevvAI()

  // Format display names
  const roleDisplay = role.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
  
  const difficultyDisplay = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (error) {
        console.error('Failed to access camera:', error)
      }
    }

    initCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (interviewState.isActive && !interviewState.isPaused) {
      interval = setInterval(() => {
        setInterviewState(prev => ({
          ...prev,
          timeElapsed: prev.timeElapsed + 1
        }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [interviewState.isActive, interviewState.isPaused])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !interviewState.videoEnabled
        setInterviewState(prev => ({
          ...prev,
          videoEnabled: !prev.videoEnabled
        }))
      }
    }
  }

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !interviewState.audioEnabled
        setInterviewState(prev => ({
          ...prev,
          audioEnabled: !prev.audioEnabled
        }))
      }
    }
  }

  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })
      
      setScreenStream(displayStream)
      if (screenRef.current) {
        screenRef.current.srcObject = displayStream
      }
      
      setInterviewState(prev => ({
        ...prev,
        screenSharing: true,
        viewMode: 'split'
      }))

      // Listen for screen share ending (user clicks "Stop sharing" in browser)
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare()
      })
      
    } catch (error) {
      console.error('Failed to start screen sharing:', error)
    }
  }

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
    }
    
    setInterviewState(prev => ({
      ...prev,
      screenSharing: false,
      viewMode: 'camera'
    }))
  }

  const toggleScreenShare = () => {
    if (interviewState.screenSharing) {
      stopScreenShare()
    } else {
      startScreenShare()
    }
  }

  const cycleViewMode = () => {
    if (!interviewState.screenSharing) return
    
    const modes: Array<'camera' | 'screen' | 'split'> = ['camera', 'screen', 'split']
    const currentIndex = modes.indexOf(interviewState.viewMode)
    const nextIndex = (currentIndex + 1) % modes.length
    
    setInterviewState(prev => ({
      ...prev,
      viewMode: modes[nextIndex]
    }))
  }

  const generateQuestion = async () => {
    setIsAiSpeaking(true)
    try {
      const prompt = `You are an AI interviewer conducting a ${difficultyDisplay} level interview for a ${roleDisplay} position. 
      This is question ${interviewState.currentQuestion} of ${interviewState.totalQuestions}.
      
      Generate a realistic interview question appropriate for this role and level. 
      Keep it professional but conversational. Only return the question, nothing else.`

      const response = await ai.chat.completions.create({
        model: 'default',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 150
      })

      const question = response.choices[0]?.message?.content || 'Tell me about yourself and why you are interested in this position.'
      setCurrentQuestion(question)
      setAiResponse('')
    } catch (error) {
      console.error('Failed to generate question:', error)
      setCurrentQuestion('Tell me about yourself and why you are interested in this position.')
    }
    setIsAiSpeaking(false)
  }

  const startInterview = async () => {
    setInterviewState(prev => ({ ...prev, isActive: true }))
    await generateQuestion()
  }

  const pauseInterview = () => {
    setInterviewState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const nextQuestion = async () => {
    if (interviewState.currentQuestion < interviewState.totalQuestions) {
      setInterviewState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1
      }))
      await generateQuestion()
    } else {
      endInterview()
    }
  }

  const endInterview = () => {
    setInterviewState(prev => ({ ...prev, isActive: false }))
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
    }
    // In a real app, you'd navigate to results page
    navigate('/')
  }

  const progress = (interviewState.currentQuestion / interviewState.totalQuestions) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="font-semibold">{roleDisplay} Interview</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{difficultyDisplay} Level</Badge>
                  {interviewState.screenSharing && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <Monitor className="w-3 h-3 mr-1" />
                        Screen Sharing
                      </Badge>
                    </>
                  )}
                  <span>•</span>
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(interviewState.timeElapsed)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Question {interviewState.currentQuestion} of {interviewState.totalQuestions}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Video Section */}
          <div className="lg:col-span-2">
            <Card className="h-fit">
              <CardContent className="p-0">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  
                  {/* Single View Mode */}
                  {interviewState.viewMode === 'camera' && (
                    <div className="aspect-video">
                      <video 
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover ${!interviewState.videoEnabled ? 'opacity-0' : ''}`}
                      />
                      
                      {!interviewState.videoEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                          <div className="text-center text-white">
                            <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm opacity-75">Camera is off</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {interviewState.viewMode === 'screen' && (
                    <div className="aspect-video">
                      <video 
                        ref={screenRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      
                      {!interviewState.screenSharing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                          <div className="text-center text-white">
                            <MonitorOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm opacity-75">Screen sharing is off</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Split View Mode */}
                  {interviewState.viewMode === 'split' && (
                    <div className="aspect-video grid grid-cols-2 gap-1">
                      {/* Camera Feed */}
                      <div className="relative bg-slate-900">
                        <video 
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className={`w-full h-full object-cover ${!interviewState.videoEnabled ? 'opacity-0' : ''}`}
                        />
                        
                        {!interviewState.videoEnabled && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <VideoOff className="w-8 h-8 text-white opacity-50" />
                          </div>
                        )}
                        
                        <div className="absolute bottom-2 left-2">
                          <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">Camera</span>
                        </div>
                      </div>
                      
                      {/* Screen Feed */}
                      <div className="relative bg-slate-900">
                        <video 
                          ref={screenRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        
                        {!interviewState.screenSharing && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <MonitorOff className="w-8 h-8 text-white opacity-50" />
                          </div>
                        )}
                        
                        <div className="absolute bottom-2 left-2">
                          <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">Screen</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controls Overlay */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full p-2">
                      <Button
                        size="sm"
                        variant={interviewState.videoEnabled ? "default" : "destructive"}
                        className="rounded-full w-10 h-10 p-0"
                        onClick={toggleVideo}
                      >
                        {interviewState.videoEnabled ? 
                          <Video className="w-4 h-4" /> : 
                          <VideoOff className="w-4 h-4" />
                        }
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={interviewState.audioEnabled ? "default" : "destructive"}
                        className="rounded-full w-10 h-10 p-0"
                        onClick={toggleAudio}
                      >
                        {interviewState.audioEnabled ? 
                          <Mic className="w-4 h-4" /> : 
                          <MicOff className="w-4 h-4" />
                        }
                      </Button>

                      <Button
                        size="sm"
                        variant={interviewState.screenSharing ? "default" : "outline"}
                        className="rounded-full w-10 h-10 p-0"
                        onClick={toggleScreenShare}
                        title={interviewState.screenSharing ? "Stop screen sharing" : "Start screen sharing"}
                      >
                        {interviewState.screenSharing ? 
                          <Monitor className="w-4 h-4" /> : 
                          <MonitorOff className="w-4 h-4" />
                        }
                      </Button>

                      {interviewState.screenSharing && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full w-10 h-10 p-0"
                          onClick={cycleViewMode}
                          title="Switch view mode"
                        >
                          {interviewState.viewMode === 'camera' && <Video className="w-4 h-4" />}
                          {interviewState.viewMode === 'screen' && <Monitor className="w-4 h-4" />}
                          {interviewState.viewMode === 'split' && <PictureInPicture className="w-4 h-4" />}
                        </Button>
                      )}

                      {interviewState.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full w-10 h-10 p-0"
                          onClick={pauseInterview}
                        >
                          {interviewState.isPaused ? 
                            <Play className="w-4 h-4" /> : 
                            <Pause className="w-4 h-4" />
                          }
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full w-10 h-10 p-0"
                        onClick={endInterview}
                      >
                        <PhoneOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interview Panel */}
          <div className="space-y-6">
            
            {/* AI Interviewer */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">AI Interviewer</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {isAiSpeaking ? 'Preparing question...' : 'Ready to interview'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              {currentQuestion && (
                <CardContent>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <p className="text-sm leading-relaxed">{currentQuestion}</p>
                    </div>
                  </div>
                  
                  {interviewState.isActive && (
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        onClick={nextQuestion}
                        disabled={interviewState.currentQuestion >= interviewState.totalQuestions}
                      >
                        {interviewState.currentQuestion >= interviewState.totalQuestions ? 
                          'Finish Interview' : 'Next Question'
                        }
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Interview Controls */}
            {!interviewState.isActive ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Ready to Start?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your AI interviewer will ask you {interviewState.totalQuestions} questions 
                    tailored to the {roleDisplay} role.
                  </p>
                  <Button onClick={startInterview} className="w-full">
                    Begin Interview
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Interview Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatTime(interviewState.timeElapsed)}</p>
                    <p className="text-xs text-muted-foreground">Total Time</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold">{interviewState.currentQuestion}</p>
                      <p className="text-xs text-muted-foreground">Current Question</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{interviewState.totalQuestions - interviewState.currentQuestion}</p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                  </div>
                  
                  {interviewState.isPaused && (
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">Interview Paused</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Interview Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li>• Maintain eye contact with the camera</li>
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Use the STAR method for behavioral questions</li>
                  <li>• Take your time to think before answering</li>
                  {(role === 'software-engineer' || role === 'data-scientist') && (
                    <li>• Use screen sharing to demonstrate coding skills</li>
                  )}
                  {interviewState.screenSharing && (
                    <li>• Switch view modes to focus on camera or screen</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewPage