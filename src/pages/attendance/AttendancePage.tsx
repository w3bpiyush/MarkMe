import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late';
  date: string;
}

interface Batch {
  id: string;
  name: string;
  course_type: string;
}

export default function AttendancePage() {
  const { batchId } = useParams<{ batchId: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchBatchDetails();
    fetchStudents();
    fetchTodayAttendance();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('id, name, course_type')
        .eq('id', batchId)
        .single();

      if (error) throw error;
      setBatch(data);
    } catch (error) {
      toast.error('Failed to fetch batch details');
      console.error('Error:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, roll_number')
        .eq('batch_id', batchId)
        .order('roll_number', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      toast.error('Failed to fetch students');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('batch_id', batchId)
        .eq('date', today);

      if (error) throw error;
      setTodayRecords(data || []);

      // Initialize attendance state from records
      const attendanceState: Record<string, 'present' | 'absent' | 'late'> = {};
      data?.forEach((record) => {
        attendanceState[record.student_id] = record.status;
      });
      setAttendance(attendanceState);
    } catch (error) {
      toast.error('Failed to fetch today\'s attendance');
      console.error('Error:', error);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));

    const existingRecord = todayRecords.find(record => record.student_id === studentId);

    try {
      if (existingRecord) {
        const { error } = await supabase
          .from('attendance_records')
          .update({
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendance_records')
          .insert([
            {
              student_id: studentId,
              batch_id: batchId,
              date: today,
              status,
              marked_by: (await supabase.auth.getUser()).data.user?.id
            }
          ]);

        if (error) throw error;
      }

      // Refresh attendance records
      fetchTodayAttendance();
    } catch (error) {
      toast.error('Failed to mark attendance');
      console.error('Error:', error);
    }
  };

  const saveAllAttendance = async () => {
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        batch_id: batchId,
        date: today,
        status,
        marked_by: user.id
      }));

      const { error } = await supabase
        .from('attendance_records')
        .upsert(
          records,
          { onConflict: 'student_id,date' }
        );

      if (error) throw error;
      toast.success('Attendance saved successfully');
      fetchTodayAttendance();
    } catch (error) {
      toast.error('Failed to save attendance');
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    const late = Object.values(attendance).filter(status => status === 'late').length;
    const unmarked = total - (present + absent + late);

    return { total, present, absent, late, unmarked };
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-8">
  <div>
    <h1 className="text-2xl font-bold text-gray-900 font-poppins">
      {batch?.name} - Attendance
    </h1>
    <p className="mt-1 text-sm text-gray-600">
      {format(new Date(), 'EEEE, MMMM d, yyyy')} • {batch?.course_type}
    </p>
  </div>

  {/* Statistics Section */}
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
    <div className="bg-green-50 p-4 rounded-lg">
      <div className="text-green-600 text-sm font-medium">Present</div>
      <div className="mt-2 text-2xl font-semibold text-green-700">{stats.present}</div>
    </div>
    <div className="bg-red-50 p-4 rounded-lg">
      <div className="text-red-600 text-sm font-medium">Absent</div>
      <div className="mt-2 text-2xl font-semibold text-red-700">{stats.absent}</div>
    </div>
    <div className="bg-yellow-50 p-4 rounded-lg">
      <div className="text-yellow-600 text-sm font-medium">Late</div>
      <div className="mt-2 text-2xl font-semibold text-yellow-700">{stats.late}</div>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="text-gray-600 text-sm font-medium">Unmarked</div>
      <div className="mt-2 text-2xl font-semibold text-gray-700">{stats.unmarked}</div>
    </div>
  </div>

  {/* Students Attendance Section */}
  {loading ? (
    <div className="text-center py-12">Loading students...</div>
  ) : students.length === 0 ? (
    <div className="text-center py-12">
      <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
      <p className="mt-1 text-sm text-gray-500">Add students to this batch to take attendance.</p>
    </div>
  ) : (
    <>
      <div className="overflow-hidden">
        {/* Cards layout for small screens */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-white p-4 rounded-md shadow-sm mb-2 flex justify-between items-center"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">{student.full_name}</h3>
                <p className="text-xs text-gray-500">Roll Number:- {student.roll_number}</p>
                <div className="mt-2 text-sm">
                  {attendance[student.id] === 'present' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Present
                    </span>
                  )}
                  {attendance[student.id] === 'absent' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Absent
                    </span>
                  )}
                  {attendance[student.id] === 'late' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Late
                    </span>
                  )}
                  {!attendance[student.id] && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Not marked
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => markAttendance(student.id, 'present')}
                  className={`p-2 rounded-full ${
                    attendance[student.id] === 'present'
                      ? 'bg-green-100 text-green-600'
                      : 'hover:bg-green-100 text-gray-400 hover:text-green-600'
                  }`}
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => markAttendance(student.id, 'absent')}
                  className={`p-2 rounded-full ${
                    attendance[student.id] === 'absent'
                      ? 'bg-red-100 text-red-600'
                      : 'hover:bg-red-100 text-gray-400 hover:text-red-600'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  onClick={() => markAttendance(student.id, 'late')}
                  className={`p-2 rounded-full ${
                    attendance[student.id] === 'late'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'hover:bg-yellow-100 text-gray-400 hover:text-yellow-600'
                  }`}
                >
                  <Clock className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveAllAttendance}
          disabled={saving || stats.unmarked === stats.total}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </>
  )}
</div>

  );
}