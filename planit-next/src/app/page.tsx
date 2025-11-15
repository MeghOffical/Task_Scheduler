import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Home() {
  // If user is logged in, redirect to dashboard
  const token = (await cookies()).get('auth_token')?.value
  if (token) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-3xl font-bold text-blue-600">Plan-it</div>
            <nav className="space-x-4">
              <Link 
                href="/login" 
                className="inline-block px-6 py-2.5 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-300"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-sm"
              >
                Register
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-blue-600">
              Task Management
            </h1>
            <h2 className="text-4xl font-bold text-gray-900">
              Made Simple
            </h2>
          </div>
          
          <p className="max-w-2xl mx-auto text-xl leading-relaxed text-gray-600">
            Transform your productivity with Plan-it's comprehensive task management platform. 
            Our intuitive system helps you organize daily tasks, set priorities, and track your progress seamlessly.
            Built with security in mind, featuring robust user authentication and reliable data storage.
          </p>

          <div className="pt-8">
            <h2 className="text-3xl font-bold text-blue-600 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-600">
              Powerful features designed to help you manage tasks efficiently and securely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <FeatureCard 
              icon="🔒" 
              title="Secure Authentication" 
              description="User registration and login with secure password hashing and session management."
            />
            <FeatureCard 
              icon="🤖" 
              title="AI Chatbot" 
              description="Intelligent AI assistant for managing tasks, providing suggestions and smart automation."
            />
            <FeatureCard 
              icon="🔔" 
              title="Notifications" 
              description="Stay on track with smart reminders and real-time notifications for your tasks."
            />
            <FeatureCard 
              icon="📊" 
              title="Export/Import" 
              description="Seamlessly import and export your task data in CSV format for easy backup."
            />
            <FeatureCard 
              icon="⏱️" 
              title="Time Tracking" 
              description="Track time spent on tasks with built-in timer and detailed productivity analytics."
            />
            <FeatureCard 
              icon="📝" 
              title="Task Management" 
              description="Create, read, update, and delete tasks with full control over your task list."
            />
            <FeatureCard 
              icon="⚡" 
              title="Undo Delete" 
              description="Accidentally deleted a task? Restore it with our undo functionality."
            />
            <FeatureCard 
              icon="👥" 
              title="Multi-User" 
              description="Each user has their own secure space with tasks isolated and protected."
            />
          </div>
        </div>
      </section>

      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 text-lg">
            Made with ❤️ by <span className="text-blue-600 font-semibold">Plan-it</span>
          </p>
        </div>
      </footer>
    </main>
  )
}

interface FeatureCardProps {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-center">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 text-center leading-relaxed">{description}</p>
    </div>
  )
}