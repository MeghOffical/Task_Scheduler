
import React from "react";

const AboutUs = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 text-gray-900 px-6 py-12 flex flex-col items-center">
      <section className="max-w-3xl w-full bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-extrabold mb-4 text-blue-600 text-center">About Plan-It</h1>
        <p className="text-lg mb-8 text-center">
          <strong>Plan-It</strong> is a modern productivity platform designed to help you organize, prioritize, and accomplish your goals with ease. Whether you’re a student, professional, or part of a team, Plan-It brings clarity and focus to your daily workflow.
        </p>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-500">Our Mission</h2>
          <p>
            To empower people everywhere to achieve more by making task management simple, smart, and enjoyable. We believe productivity should be stress-free and tailored to your unique needs.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-500">Key Features</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Quick and intuitive task creation</li>
            <li>Pomodoro timer for focused work sessions</li>
            <li>Detailed analytics dashboard to track progress</li>
            <li>Custom reminders and notifications</li>
            <li>Collaboration tools for teams</li>
            <li>Seamless calendar integration</li>
          </ul>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-blue-500">Our Story</h2>
          <p>
            Plan-It began as a vision to simplify productivity for everyone. Our diverse team of developers, designers, and productivity enthusiasts came together to address the real struggles of managing tasks, deadlines, and work-life balance. Through collaboration and innovation, Plan-It has grown into a platform trusted by users worldwide for its reliability and user-centric features.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2 text-blue-500">Future Vision</h2>
          <p>
            Looking ahead, Plan-It will introduce smarter automation, personalized productivity insights, and seamless integration with your favorite tools. We are dedicated to listening to our community and evolving to meet the changing needs of modern work and life. Join us as we shape the future of productivity together!
          </p>
        </div>
      </section>
    </main>
  );
};

export default AboutUs;
