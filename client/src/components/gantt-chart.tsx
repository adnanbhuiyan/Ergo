import { useMemo } from "react";

interface Task {
  id: string;
  name: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  created_at: string;
  estimated_completion_time?: number | null;
  actual_completion_time?: number | null;
  completed_on?: string | null;
}

interface GanttChartProps {
  tasks: Task[];
}

export function GanttChart({ tasks }: GanttChartProps) {
  // Calculate date range for the chart
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30); // Default to 30 days if no tasks
      return { start: today, end: endDate };
    }

    let earliestStart = new Date(tasks[0].created_at);
    let latestEnd = new Date(tasks[0].due_date);

    tasks.forEach((task) => {
      const startDate = new Date(task.created_at);
      const endDate = new Date(task.due_date);
      
      if (startDate < earliestStart) earliestStart = startDate;
      if (endDate > latestEnd) latestEnd = endDate;
    });

    // Add some padding
    earliestStart.setDate(earliestStart.getDate() - 7);
    latestEnd.setDate(latestEnd.getDate() + 7);

    return { start: earliestStart, end: latestEnd };
  }, [tasks]);

  // Generate date columns (days)
  const dateColumns = useMemo(() => {
    const dates: Date[] = [];
    const current = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [dateRange]);

  // Calculate total days in range
  const totalDays = useMemo(() => {
    const diffTime = dateRange.end.getTime() - dateRange.start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [dateRange]);

  // Calculate task bar position and width
  const getTaskBarStyle = (task: Task) => {
    const startDate = new Date(task.created_at);
    let endDate = new Date(task.due_date);
    
    // If due_date is before created_at, use estimated_completion_time
    if (endDate < startDate && task.estimated_completion_time) {
      endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + (task.estimated_completion_time || 0));
    }
    
    // Ensure end date is at least 1 day after start
    if (endDate <= startDate) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const daysFromStart = Math.floor(
      (startDate.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const leftPercent = (daysFromStart / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;

    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.max(2, widthPercent)}%`, // Minimum 2% width for visibility
    };
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-600";
      case "In-Progress":
        return "bg-blue-600";
      case "Blocked":
        return "bg-red-600";
      case "In-Review":
        return "bg-purple-600";
      default:
        return "bg-gray-500";
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No tasks to display in Gantt chart</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header with date scale */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
        <div className="flex">
          {/* Task name column header */}
          <div className="w-64 flex-shrink-0 p-3 border-r border-gray-200 font-semibold text-sm text-gray-700">
            Task
          </div>
          {/* Date columns */}
          <div className="flex-1 flex min-w-[800px]">
            {dateColumns.map((date, index) => {
              const isFirstOfMonth =
                index === 0 || date.getDate() === 1 || dateColumns[index - 1].getMonth() !== date.getMonth();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isToday = date.toDateString() === new Date().toDateString();
              const isFirstOfWeek = date.getDay() === 0 || index === 0;

              return (
                <div
                  key={index}
                  className={`relative flex-1 min-w-[40px] border-r border-gray-200 p-2 text-center text-xs ${
                    isWeekend ? "bg-gray-100" : "bg-white"
                  } ${isToday ? "bg-blue-50 border-blue-300" : ""}`}
                >
                  {isFirstOfMonth && (
                    <div className="font-semibold text-gray-700 mb-1">
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </div>
                  )}
                  <div className={`font-medium ${isToday ? "text-blue-600 font-bold" : "text-gray-600"}`}>
                    {date.getDate()}
                  </div>
                  <div className="text-gray-400 text-[10px] mt-1">
                    {date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)}
                  </div>
                  {isToday && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task rows */}
      <div className="divide-y divide-gray-200">
        {tasks.map((task, taskIndex) => {
          const barStyle = getTaskBarStyle(task);
          const isCompleted = task.status === "Completed" || task.completed_on !== null;

          return (
            <div key={task.id} className="flex hover:bg-gray-50 transition-colors">
              {/* Task name column */}
              <div className="w-64 flex-shrink-0 p-3 border-r border-gray-200">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}
                    title={task.status}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate" title={task.name}>
                      {task.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(task.created_at).toLocaleDateString()} -{" "}
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline column */}
              <div className="flex-1 relative min-w-[800px] p-2">
                <div className="relative h-12">
                  {/* Today indicator line - shown on first task row */}
                  {taskIndex === 0 && (() => {
                    const today = new Date();
                    if (today >= dateRange.start && today <= dateRange.end) {
                      const todayPercent = ((today.getTime() - dateRange.start.getTime()) / (dateRange.end.getTime() - dateRange.start.getTime())) * 100;
                      return (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                          style={{ left: `${todayPercent}%` }}
                        >
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
                            Today
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Task bar */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md ${getPriorityColor(
                      task.priority
                    )} ${isCompleted ? "opacity-60" : ""} shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${
                      isCompleted ? "border-green-300" : "border-white"
                    }`}
                    style={barStyle}
                    title={`${task.name}\nPriority: ${task.priority}\nStatus: ${task.status}\nStart: ${new Date(task.created_at).toLocaleDateString()}\nDue: ${new Date(task.due_date).toLocaleDateString()}`}
                  >
                    <div className="h-full flex items-center px-2 text-white text-xs font-medium truncate">
                      {barStyle.width && parseFloat(barStyle.width) > 5 ? task.name : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="font-semibold text-gray-700">Legend:</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Low Priority</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-gray-600">In Progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}

