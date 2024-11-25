'use client'

import React, { useState, useEffect } from 'react'
import { Search, Clock, ChevronUp, ChevronDown } from 'lucide-react'
import { useLogStore } from '../store/logStore'
import type { Log } from '../types'
import JsonView from '@uiw/react-json-view'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const levelColors = {
  INFO: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-400' },
  WARN: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  ERROR: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-400' },
  LOG: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', dot: 'bg-gray-400' },
  START_TURN: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-400' },
  INSTRUCT: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-400' },
  MESSAGE_COMPLETION: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', dot: 'bg-indigo-400' },
  POST_MESSAGE_COMPLETION: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', dot: 'bg-teal-400' },
  TOOL_EXECUTION: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-400' },
  POST_TOOL_EXECUTION: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', dot: 'bg-pink-400' },
  HANDOFF: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', dot: 'bg-cyan-400' }
} as const;

type LogLevel = keyof typeof levelColors
type SortField = 'timestamp' | 'level' | 'agent' | 'message'
type SortDirection = 'asc' | 'desc'

function isValidLogLevel(level: string): level is LogLevel {
  return Object.keys(levelColors).includes(level)
}

export default function LogsView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set())
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(new Set())
  const { logs } = useLogStore()

  useEffect(() => {
    const newIds = new Set(logs.slice(-5).map(log => log.id))
    setNewLogIds(newIds)
    const timer = setTimeout(() => setNewLogIds(new Set()), 2000)
    return () => clearTimeout(timer)
  }, [logs])

  const handleRowClick = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId)
  }

  const toggleFilter = (level: LogLevel) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev)
      if (newFilters.has(level)) {
        newFilters.delete(level)
      } else {
        newFilters.add(level)
      }
      return newFilters
    })
  }

  const sortLogs = (a: Log, b: Log) => {
    let comparison = 0
    switch (sortField) {
      case 'timestamp':
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        break
      case 'level':
        comparison = (a.level || '').localeCompare(b.level || '')
        break
      case 'agent':
        comparison = (a.agent || '').localeCompare(b.agent || '')
        break
      case 'message':
        comparison = (a.message || '').localeCompare(b.message || '')
        break
    }
    return sortDirection === 'asc' ? comparison : -comparison
  }

  const filteredLogs = (logs || [])
    .filter(log => {
      if (!searchTerm && activeFilters.size === 0) return true
      
      const matchesSearch = !searchTerm || 
        (log.agent || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (log.message || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = activeFilters.size === 0 || 
        (isValidLogLevel(log.level) && activeFilters.has(log.level))
      
      return matchesSearch && matchesFilter
    })
    .sort(sortLogs)

  const getLogColors = (level: string) => {
    if (isValidLogLevel(level)) {
      return levelColors[level]
    }
    return levelColors.INFO
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 inline-block ml-1" /> :
      <ChevronDown className="h-4 w-4 inline-block ml-1" />
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              className="pl-10"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e: { target: { value: React.SetStateAction<string> } }) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(levelColors).map((level) => {
              const isActive = activeFilters.has(level as LogLevel)
              return (
                <Badge
                  key={level}
                  variant={isActive ? "default" : "outline"}
                  className={`cursor-pointer transition-all hover:opacity-80 ${
                    isActive 
                      ? `${levelColors[level as LogLevel].bg} ${levelColors[level as LogLevel].text}`
                      : `hover:${levelColors[level as LogLevel].bg} hover:${levelColors[level as LogLevel].text}`
                  }`}
                  onClick={() => toggleFilter(level as LogLevel)}
                >
                  {level}
                </Badge>
              )
            })}
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('timestamp')} className="cursor-pointer">
                  Timestamp {renderSortIndicator('timestamp')}
                </TableHead>
                <TableHead onClick={() => handleSort('agent')} className="cursor-pointer">
                  Agent {renderSortIndicator('agent')}
                </TableHead>
                <TableHead onClick={() => handleSort('level')} className="cursor-pointer">
                  Event Type {renderSortIndicator('level')}
                </TableHead>
                
                <TableHead onClick={() => handleSort('message')} className="cursor-pointer">
                  Message {renderSortIndicator('message')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow
                    onClick={() => handleRowClick(log.id)}
                    className={`cursor-pointer transition-all duration-200 hover:bg-gray-50
                      ${newLogIds.has(log.id) ? 'animate-highlight' : ''}`}
                  >
                    <TableCell>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="h-4 w-8 mr-2 text-gray-400" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <ChevronDown className={`h-4 w-8 text-gray-400 transition-transform duration-200 
                          ${expandedLogId === log.id ? 'rotate-180' : ''}`} />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{log.agent}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getLogColors(log.level).bg} ${getLogColors(log.level).text}`}>
                        {log.level}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>{log.message}</TableCell>
                  </TableRow>
                  {expandedLogId === log.id && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Card className="mt-2 mb-4">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Timestamp</h4>
                                <p className="mt-1 text-sm">{new Date(log.timestamp).toLocaleString()}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Event Type</h4>
                                <Badge variant="outline" className={`mt-1 ${getLogColors(log.level).bg} ${getLogColors(log.level).text}`}>
                                  {log.level}
                                </Badge>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Agent</h4>
                                <p className="mt-1 text-sm">{log.agent}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Message</h4>
                                <p className="mt-1 text-sm">{log.message}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-2">Details</h4>
                              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 border">
                                <JsonView value={log.details} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
