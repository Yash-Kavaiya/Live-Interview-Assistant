import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination from state, default to interview page
  const from = location.state?.from?.pathname || '/interview';
  
  const handleStartInterview = () => {
    navigate(from, { replace: true });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            InterviewAce
          </h1>
          <p className="text-muted-foreground mt-2">
            Start your mock interview - no sign-up required
          </p>
        </div>
        
        <Card className="border-border/50 shadow-lg backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  Welcome to InterviewAce
                </CardTitle>
                <CardDescription>
                  Ready to start your mock interview session?
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Practice your interview skills with AI-powered mock interviews. 
                Get real-time feedback and improve your performance.
              </p>
              
              <Button 
                onClick={handleStartInterview}
                className="w-full h-11" 
                size="lg"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Start Mock Interview
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            No authentication required - jump straight into practicing interviews with AI assistance.
          </p>
        </div>
      </div>
    </div>
  );
}