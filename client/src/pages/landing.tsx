import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, BarChart3, Brain, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Stratos Skill Swap</h1>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Connect. Collaborate. 
            <span className="text-orange-500"> Create.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Discover talented colleagues, showcase your expertise, and build amazing projects together. 
            Your organization's internal skill marketplace.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Talent Discovery</CardTitle>
              <CardDescription>
                Find colleagues with the exact skills you need for your next project
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Project Matching</CardTitle>
              <CardDescription>
                Get AI-powered recommendations for projects that match your skills
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Gain insights into organizational skill gaps and development opportunities
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Platform Features */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-8">
            Platform Capabilities
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <Brain className="h-5 w-5 text-orange-500 mr-2" />
                AI Intelligence
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li>• Smart project-employee compatibility scoring</li>
                <li>• Intelligent team member recommendations</li>
                <li>• Skills gap analysis with priority scoring</li>
                <li>• Organizational talent insights</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 text-orange-500 mr-2" />
                Secure Platform
              </h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li>• Enterprise-grade authentication</li>
                <li>• Role-based access controls</li>
                <li>• Secure profile management</li>
                <li>• Data privacy protection</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-700 rounded-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center">
              <Zap className="h-5 w-5 text-orange-500 mr-2" />
              Key Features
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Skill Tree Visualization</Badge>
              <Badge variant="secondary">Project Collaboration Hub</Badge>
              <Badge variant="secondary">Endorsement System</Badge>
              <Badge variant="secondary">Department Analytics</Badge>
              <Badge variant="secondary">Trending Skills Tracking</Badge>
              <Badge variant="secondary">Email Integration</Badge>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to Transform Your Team?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
            Join your colleagues and start building amazing projects together.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    </div>
  );
}