'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter,
  Search
} from 'lucide-react'
import { format, addMonths, subMonths, startOfToday } from 'date-fns'
import { useState } from 'react'

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

interface CalendarToolbarProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  currentView: CalendarView
  onViewChange: (view: CalendarView) => void
  appointmentCount?: number
  onTodayClick?: () => void
  className?: string
}

export default function CalendarToolbar({
  currentDate,
  onDateChange,
  currentView,
  onViewChange,
  appointmentCount = 0,
  onTodayClick,
  className = ''
}: CalendarToolbarProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const handlePrevious = () => {
    const newDate = subMonths(currentDate, 1)
    onDateChange(newDate)
  }

  const handleNext = () => {
    const newDate = addMonths(currentDate, 1)
    onDateChange(newDate)
  }

  const handleToday = () => {
    const today = startOfToday()
    onDateChange(today)
    if (onTodayClick) {
      onTodayClick()
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date)
      setIsDatePickerOpen(false)
    }
  }

  const getViewLabel = (view: CalendarView) => {
    switch (view) {
      case 'month':
        return 'Month'
      case 'week':
        return 'Week'
      case 'day':
        return 'Day'
      case 'agenda':
        return 'Agenda'
      default:
        return 'Month'
    }
  }

  const getDateRangeText = () => {
    switch (currentView) {
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'week':
        // For week view, show the week range
        return format(currentDate, 'MMM dd, yyyy')
      case 'day':
        return format(currentDate, 'EEEE, MMMM dd, yyyy')
      case 'agenda':
        return format(currentDate, 'MMMM yyyy')
      default:
        return format(currentDate, 'MMMM yyyy')
    }
  }

  return (
    <div className={`flex items-center justify-between gap-6 ${className}`}>
      {/* Left side - Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="h-8"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Today
        </Button>

        {/* Date Picker */}
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 font-semibold"
            >
              <CalendarIcon className="h-4 w-4" />
              {getDateRangeText()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Center - Appointment Count Badge */}
      {appointmentCount > 0 && (
        <Badge variant="secondary" className="gap-1">
          <span className="text-xs font-semibold">
            {appointmentCount} appointment{appointmentCount !== 1 ? 's' : ''}
          </span>
        </Badge>
      )}

      {/* Right side - View Selector */}
      <div className="flex items-center gap-2">
        <Select value={currentView} onValueChange={(value: CalendarView) => onViewChange(value)}>
          <SelectTrigger className="h-8 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="agenda">Agenda</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}