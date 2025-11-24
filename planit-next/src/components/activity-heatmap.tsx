'use client';

import { useEffect, useState } from 'react';

interface ActivityHeatmapProps {
  activity: { [date: string]: number };
}

export default function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  const [weeks, setWeeks] = useState<Array<Array<{ date: Date; count: number }>>>([]);
  const [tooltipData, setTooltipData] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  const [yearOffset, setYearOffset] = useState(0);

  useEffect(() => {
    generateWeeks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, yearOffset]);

  const generateWeeks = () => {
    const today = new Date();
    const currentYear = today.getFullYear() - yearOffset;
    
    const weeksData: Array<Array<{ date: Date; count: number }>> = [];

    // Start from January 1st of the current year
    const startDate = new Date(currentYear, 0, 1);
    
    // Find the Sunday before or on January 1st (week starts on Sunday)
    const dayOfWeek = startDate.getDay();
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() - dayOfWeek);
    
    // End on December 31st of the current year
    const endDate = new Date(currentYear, 11, 31);
    
    // Find the Saturday after or on December 31st
    const endDayOfWeek = endDate.getDay();
    const weekEndDate = new Date(endDate);
    if (endDayOfWeek !== 6) {
      weekEndDate.setDate(endDate.getDate() + (6 - endDayOfWeek));
    }
    
    let currentDate = new Date(weekStartDate);
    
    while (currentDate <= weekEndDate) {
      const currentWeek: Array<{ date: Date; count: number }> = [];
      
      // Generate 7 days for the week (Sunday to Saturday)
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = activity[dateStr] || 0;

        currentWeek.push({
          date: new Date(currentDate),
          count,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeksData.push(currentWeek);
    }

    setWeeks(weeksData);
  };

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-gray-200 dark:bg-gray-800';
    if (count <= 2) return 'bg-green-200 dark:bg-green-900';
    if (count <= 4) return 'bg-green-400 dark:bg-green-700';
    if (count <= 6) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-800 dark:bg-green-400';
  };

  const handleMouseEnter = (date: Date, count: number, event: React.MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    const container = target.closest('.heatmap-container') as HTMLElement;
    if (!container) return;
    
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate position relative to container
    const x = targetRect.left - containerRect.left + targetRect.width + 10;
    const y = targetRect.top - containerRect.top + targetRect.height / 2;
    
    setTooltipData({
      date: date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
      count,
      x,
      y,
    });
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get month data with week ranges - count weeks that contain any days of that month
  const getMonthData = () => {
    const monthsData: Array<{ month: string; startWeek: number; weekCount: number; year: number }> = [];
    const today = new Date();
    const currentYear = today.getFullYear() - yearOffset;
    
    // For each month, find which weeks contain days from that month
    for (let month = 0; month < 12; month++) {
      let firstWeekIndex = -1;
      let lastWeekIndex = -1;
      
      weeks.forEach((week, weekIndex) => {
        // Check if this week has any days from the current month and year
        const hasMonthDays = week.some(day => 
          day.date.getMonth() === month && day.date.getFullYear() === currentYear
        );
        
        if (hasMonthDays) {
          if (firstWeekIndex === -1) {
            firstWeekIndex = weekIndex;
          }
          lastWeekIndex = weekIndex;
        }
      });
      
      if (firstWeekIndex !== -1) {
        monthsData.push({
          month: months[month],
          startWeek: firstWeekIndex,
          weekCount: lastWeekIndex - firstWeekIndex + 1,
          year: currentYear,
        });
      }
    }

    return monthsData;
  };

  const monthsData = getMonthData();

  const canGoPrevious = yearOffset < 5; // Limit to 5 years back
  const canGoNext = yearOffset > 0; // Can only go next if we're viewing a past year

  const getCurrentYearRange = () => {
    const today = new Date();
    const currentYear = today.getFullYear() - yearOffset;
    
    return `${currentYear}`;
  };

  return (
    <div className="relative heatmap-container">
      {/* Year navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {getCurrentYearRange()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setYearOffset(yearOffset + 1)}
            disabled={!canGoPrevious}
            className="px-3 py-1 text-xs rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous Year
          </button>
          <button
            onClick={() => setYearOffset(yearOffset - 1)}
            disabled={!canGoNext}
            className="px-3 py-1 text-xs rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next Year →
          </button>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="relative overflow-x-auto">
        {/* Month labels and grid */}
        <div className="flex gap-4">
          {/* Day labels column */}
          <div className="flex flex-col mr-2">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 h-5"></div>
            <div className="flex flex-col gap-[3px] text-[9px] text-gray-500 dark:text-gray-500">
              <div className="h-[10px] flex items-center">Sun</div>
              <div className="h-[10px] flex items-center">Mon</div>
              <div className="h-[10px] flex items-center">Tue</div>
              <div className="h-[10px] flex items-center">Wed</div>
              <div className="h-[10px] flex items-center">Thu</div>
              <div className="h-[10px] flex items-center">Fri</div>
              <div className="h-[10px] flex items-center">Sat</div>
            </div>
          </div>
          
          {monthsData.map((monthData, monthIdx) => (
            <div key={monthIdx} className="flex flex-col">
              {/* Month label */}
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 h-5 font-medium">
                {monthData.month}
              </div>
              
              {/* Weeks for this month */}
              <div className="flex gap-[3px]">
                {weeks.slice(monthData.startWeek, monthData.startWeek + monthData.weekCount).map((week, weekIdx) => (
                  <div key={monthData.startWeek + weekIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIdx) => {
                      const isCurrentMonth = day.date.getMonth() === monthIdx && day.date.getFullYear() === monthData.year;
                      return (
                        <div
                          key={dayIdx}
                          className={`w-[10px] h-[10px] rounded-sm transition-all relative ${getIntensityClass(day.count)} ${!isCurrentMonth ? 'opacity-30 cursor-default' : 'cursor-pointer hover:ring-2 hover:ring-blue-500 hover:scale-125 hover:z-10'}`}
                          onMouseEnter={isCurrentMonth ? (e) => handleMouseEnter(day.date, day.count, e) : undefined}
                          onMouseLeave={isCurrentMonth ? handleMouseLeave : undefined}
                          title={isCurrentMonth ? `${day.count} tasks completed` : ''}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-800"></div>
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900"></div>
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700"></div>
          <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500"></div>
          <div className="w-3 h-3 rounded-sm bg-green-800 dark:bg-green-400"></div>
        </div>
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="absolute z-50 px-4 py-3 text-sm text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-xl pointer-events-none border border-gray-700 whitespace-nowrap"
          style={{
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="text-gray-300 dark:text-gray-400 text-xs mb-1">
            {tooltipData.date}
          </div>
          <div className="font-bold text-base">
            {tooltipData.count} {tooltipData.count === 1 ? 'task' : 'tasks'} completed
          </div>
          {tooltipData.count === 0 && (
            <div className="text-gray-400 dark:text-gray-500 text-xs mt-1 italic">
              No activity
            </div>
          )}
        </div>
      )}
    </div>
  );
}
