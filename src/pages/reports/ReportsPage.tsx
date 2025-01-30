import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';

interface Batch {
  id: string;
  name: string;
}

interface AttendanceStats {
  date: string;
  present: number;
  absent: number;
  late: number;
}

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
}

interface AttendanceRecord {
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

const COLORS = ['#22C55E', '#EF4444', '#F59E0B'];

export default function ReportsPage() {
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'month'>('7days');
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [overallStats, setOverallStats] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchAttendanceStats();
    }
  }, [selectedBatch, dateRange]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      toast.error('Failed to fetch batches');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const endDate = new Date();
    let startDate;

    switch (dateRange) {
      case '7days':
        startDate = subDays(endDate, 6);
        break;
      case '30days':
        startDate = subDays(endDate, 29);
        break;
      case 'month':
        startDate = startOfMonth(endDate);
        endDate.setTime(endOfMonth(endDate).getTime());
        break;
    }

    return {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    };
  };

  const fetchAttendanceStats = async () => {
    if (!selectedBatch) return;

    setLoading(true);
    const { start, end } = getDateRange();

    try {
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('batch_id', selectedBatch)
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;

      // Process daily stats
      const dailyStats: Record<string, AttendanceStats> = {};
      records?.forEach(record => {
        if (!dailyStats[record.date]) {
          dailyStats[record.date] = {
            date: record.date,
            present: 0,
            absent: 0,
            late: 0
          };
        }
        dailyStats[record.date][record.status]++;
      });

      const stats = Object.values(dailyStats).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setAttendanceStats(stats);

      // Calculate overall stats
      const total = records?.length || 0;
      const present = records?.filter(r => r.status === 'present').length || 0;
      const absent = records?.filter(r => r.status === 'absent').length || 0;
      const late = records?.filter(r => r.status === 'late').length || 0;

      setOverallStats([
        { name: 'Present', value: present },
        { name: 'Absent', value: absent },
        { name: 'Late', value: late }
      ]);

    } catch (error) {
      toast.error('Failed to fetch attendance statistics');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!selectedBatch) return;

    try {
      const batch = batches.find(b => b.id === selectedBatch);
      const { start, end } = getDateRange();
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(`Attendance Report - ${batch?.name}`, 20, 20);
      
      // Add date range
      doc.setFontSize(12);
      doc.text(`Period: ${format(new Date(start), 'MMM d, yyyy')} to ${format(new Date(end), 'MMM d, yyyy')}`, 20, 30);
      
      // Add overall statistics
      doc.setFontSize(14);
      doc.text('Overall Statistics', 20, 45);
      
      overallStats.forEach((stat, index) => {
        doc.setFontSize(12);
        doc.text(`${stat.name}: ${stat.value}`, 20, 55 + (index * 10));
      });
      
      // Save the PDF
      doc.save(`attendance-report-${batch?.name}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
      console.error('Error:', error);
    }
  };

  const exportToCSV = async () => {
    if (!selectedBatch) return;

    try {
      const batch = batches.find(b => b.id === selectedBatch);
      const { start, end } = getDateRange();

      // Fetch all students in the batch
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, roll_number')
        .eq('batch_id', selectedBatch);

      // Fetch attendance records
      const { data: records } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('batch_id', selectedBatch)
        .gte('date', start)
        .lte('date', end);

      if (!students || !records) return;

      // Process data for CSV
      const studentAttendance = students.map(student => {
        const studentRecords = records.filter(r => r.student_id === student.id);
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        const total = studentRecords.length;
        const attendancePercentage = total > 0 ? ((present + late) / total) * 100 : 0;

        return {
          'Roll Number': student.roll_number,
          'Name': student.full_name,
          'Present Days': present,
          'Absent Days': absent,
          'Late Days': late,
          'Attendance %': attendancePercentage.toFixed(2)
        };
      });

      // Convert to CSV
      const csv = Papa.unparse(studentAttendance);
      
      // Create and download CSV file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `attendance-${batch?.name}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();

      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-poppins">Attendance Reports</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and analyze attendance statistics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="batch" className="block text-sm font-medium text-gray-700">
            Select Batch
          </label>
          <select
            id="batch"
            className="mt-1 input-field"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">Select a batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
            Date Range
          </label>
          <select
            id="dateRange"
            className="mt-1 input-field"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {selectedBatch && !loading && (
        <div className="space-y-8">
          <div className="flex justify-end gap-4">
            <button
              onClick={exportToCSV}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Attendance Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Daily Attendance</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'MMM d')}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => format(new Date(date), 'MMMM d, yyyy')}
                    />
                    <Legend />
                    <Bar dataKey="present" fill="#22C55E" name="Present" />
                    <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                    <Bar dataKey="late" fill="#F59E0B" name="Late" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overall Statistics Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Overall Statistics</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overallStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {overallStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">Loading statistics...</div>
      )}

      {!selectedBatch && !loading && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No batch selected</h3>
          <p className="mt-1 text-sm text-gray-500">Select a batch to view attendance reports.</p>
        </div>
      )}
    </div>
  );
}