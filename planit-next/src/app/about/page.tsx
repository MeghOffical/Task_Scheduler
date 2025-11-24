import React from "react";

const AboutUs = () => {
  return (
    <main className="min-h-screen bg-white text-gray-900 px-6 py-12 flex flex-col items-center">
      <section className="max-w-3xl w-full">
        <h1 className="text-4xl font-bold mb-4 text-blue-600">About Us</h1>
        <p className="text-lg mb-8">
          <strong>Planit Task Scheduler</strong> is your intelligent companion for organizing, tracking, and optimizing your daily tasks. Designed for students, professionals, and teams, Planit helps you stay productive and focused.
        </p>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-500">Our Mission</h2>
          <p>
            Empower everyone to achieve more by making task management simple, smart, and enjoyable. We believe productivity should be accessible, stress-free, and tailored to your unique workflow.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-500">Key Features</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Intuitive task creation and scheduling</li>
            <li>Pomodoro timer for focused work sessions</li>
            <li>Analytics dashboard to track progress</li>
            <li>Customizable reminders and notifications</li>
            <li>Collaborative tools for teams</li>
            <li>Seamless integration with calendars</li>
          </ul>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-500">Our Story</h2>
          <p>
            Planit was born out of a simple need: balancing studies, work, and life without feeling overwhelmed. Our founder, Dhruvi, started this project as a university prototype, inspired by the challenges of managing multiple deadlines. With feedback from friends and mentors, Planit evolved into a robust platform now used by hundreds.
          </p>
        </div>


        <div>
          <h2 className="text-2xl font-semibold mb-2 text-blue-500">Future Vision</h2>
          <p>
            We aim to expand Planit with AI-powered suggestions, deeper integrations, and more collaborative features. Our vision is to become the go-to productivity platform for individuals and teams worldwide.
          </p>
        </div>
      </section>
    </main>
  );
};

export default AboutUs;
