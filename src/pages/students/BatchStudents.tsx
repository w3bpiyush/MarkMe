import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, UserPlus, Trash2, AlertCircle, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  grade: string;
  contact_info: {
    phone: string;
    email: string;
    parent_name: string;
    parent_phone: string;
  };
}

interface Batch {
  id: string;
  name: string;
  course_type: string;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (student: Omit<Student, 'id'>) => void;
  title: string;
  submitLabel: string;
  initialData?: Student;
  existingRollNumbers: string[];
}

function DeleteModal({ isOpen, onClose, onConfirm, title, message }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentForm({ isOpen, onClose, onSubmit, title, submitLabel, initialData, existingRollNumbers }: StudentFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    roll_number: '',
    grade: '',
    contact_info: {
      phone: '',
      email: '',
      parent_name: '',
      parent_phone: '',
    },
  });
  const [rollNumberError, setRollNumberError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset form data when adding a new student
      setFormData({
        full_name: '',
        roll_number: '',
        grade: '',
        contact_info: {
          phone: '',
          email: '',
          parent_name: '',
          parent_phone: '',
        },
      });
    }
    setRollNumberError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validateRollNumber = (rollNumber: string) => {
    if (!rollNumber) return 'Roll number is required';
    if (existingRollNumbers.includes(rollNumber) && rollNumber !== initialData?.roll_number) {
      return 'This roll number is already in use';
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateRollNumber(formData.roll_number);
    if (error) {
      setRollNumberError(error);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-5 w-5 transform rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              className="input-field mt-1"
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, full_name: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Roll Number</label>
            <input
              type="text"
              required
              className={`input-field mt-1 ${rollNumberError ? 'border-red-500' : ''}`}
              value={formData.roll_number}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, roll_number: e.target.value }));
                setRollNumberError('');
              }}
            />
            {rollNumberError && (
              <p className="mt-1 text-sm text-red-600">{rollNumberError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Grade</label>
            <input
              type="text"
              required
              className="input-field mt-1"
              value={formData.grade}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, grade: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              required
              className="input-field mt-1"
              value={formData.contact_info.phone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contact_info: { ...prev.contact_info, phone: e.target.value },
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="input-field mt-1"
              value={formData.contact_info.email}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contact_info: { ...prev.contact_info, email: e.target.value },
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Parent Name</label>
            <input
              type="text"
              required
              className="input-field mt-1"
              value={formData.contact_info.parent_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contact_info: { ...prev.contact_info, parent_name: e.target.value },
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Parent Phone</label>
            <input
              type="tel"
              required
              className="input-field mt-1"
              value={formData.contact_info.parent_phone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contact_info: { ...prev.contact_info, parent_phone: e.target.value },
                }))
              }
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BatchStudents() {
  const { batchId } = useParams<{ batchId: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    studentId?: string;
    studentName?: string;
  }>({ isOpen: false });

  useEffect(() => {
    fetchBatchDetails();
    fetchStudents();
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
        .select('*')
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

  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    setLoading(true);

    try {
      const { error } = await supabase.from('students').insert([
        {
          ...studentData,
          batch_id: batchId,
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          toast.error('A student with this roll number already exists in this batch');
        } else {
          toast.error('Failed to add student');
        }
        return;
      }

      toast.success('Student added successfully');
      setShowAddForm(false);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to add student');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async (studentData: Omit<Student, 'id'>) => {
    if (!editStudent) return;

    try {
      const { error } = await supabase
        .from('students')
        .update(studentData)
        .eq('id', editStudent.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('A student with this roll number already exists in this batch');
        } else {
          toast.error('Failed to update student');
        }
        return;
      }

      toast.success('Student updated successfully');
      setEditStudent(null);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to update student');
      console.error('Error:', error);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteModal.studentId) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', deleteModal.studentId);

      if (error) throw error;

      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    } finally {
      setDeleteModal({ isOpen: false });
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const existingRollNumbers = students.map(student => student.roll_number);

  return (
    <div className="space-y-8">
  {/* Header Section */}
  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 font-poppins">
        {batch?.name} - Students
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {batch?.course_type} • Manage students in this batch
      </p>
    </div>
    <button
      onClick={() => setShowAddForm(true)}
      className="btn-primary flex items-center gap-2"
    >
      <UserPlus className="h-5 w-5" />
      Add Student
    </button>
  </div>

  {/* Search Input */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
    <input
      type="text"
      placeholder="Search students..."
      className="input-field pl-10 w-full"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>

  {/* Loading & Empty State Handling */}
  {loading ? (
    <div className="text-center py-12">Loading students...</div>
  ) : filteredStudents.length === 0 ? (
    <div className="text-center py-12">
      <p className="text-gray-500">No students found in this batch.</p>
    </div>
  ) : (
    <>
      {/* Desktop Table (Hidden on Mobile) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roll No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.roll_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.full_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.grade}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{student.contact_info.phone}</div>
                  <div className="text-xs">{student.contact_info.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{student.contact_info.parent_name}</div>
                  <div>{student.contact_info.parent_phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditStudent(student)}
                      className="text-gray-400 hover:text-purple-500 transition-colors"
                      aria-label="Edit Student"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteModal({
                          isOpen: true,
                          studentId: student.id,
                          studentName: student.full_name,
                        })
                      }
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Delete Student"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards (Hidden on Desktop) */}
      <div className="md:hidden space-y-4">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{student.full_name}</h3>
                <p className="text-sm text-gray-500">
                  Roll No: {student.roll_number}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditStudent(student)}
                  className="text-gray-400 hover:text-purple-500 transition-colors"
                  aria-label="Edit Student"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setDeleteModal({
                      isOpen: true,
                      studentId: student.id,
                      studentName: student.full_name,
                    })
                  }
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Delete Student"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-sm mt-2">
              <strong>Grade:</strong> {student.grade}
            </p>
            <p className="text-sm">
              <strong>Phone:</strong> {student.contact_info.phone}
            </p>
            <p className="text-sm">
              <strong>Email:</strong> {student.contact_info.email}
            </p>
            <p className="text-sm">
              <strong>Parent:</strong> {student.contact_info.parent_name} ({student.contact_info.parent_phone})
            </p>
          </div>
        ))}
      </div>
    </>
  )}

  {/* Modals for Student Management */}
  <StudentForm
    isOpen={showAddForm}
    onClose={() => setShowAddForm(false)}
    onSubmit={handleAddStudent}
    title="Add New Student"
    submitLabel="Add Student"
    existingRollNumbers={existingRollNumbers}
  />

  <StudentForm
    isOpen={!!editStudent}
    onClose={() => setEditStudent(null)}
    onSubmit={handleEditStudent}
    title="Edit Student"
    submitLabel="Save Changes"
    initialData={editStudent || undefined}
    existingRollNumbers={existingRollNumbers}
  />

  <DeleteModal
    isOpen={deleteModal.isOpen}
    onClose={() => setDeleteModal({ isOpen: false })}
    onConfirm={handleDeleteStudent}
    title="Delete Student"
    message={`Are you sure you want to delete "${deleteModal.studentName}"? This will also delete all attendance records for this student. This action cannot be undone.`}
  />
</div>

  );
}