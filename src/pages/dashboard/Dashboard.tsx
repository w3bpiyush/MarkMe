import React, { useEffect, useState } from 'react';
import { Plus, Trash2, AlertCircle, Edit } from 'lucide-react';
import { supabase, safeQuery } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import CreateBatchModal from '../../components/CreateBatchModal';
import { useNavigate } from 'react-router-dom';

interface Batch {
  id: string;
  name: string;
  course_type: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

interface EditBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (batch: Omit<Batch, 'id' | 'created_at'>) => void;
  batch: Batch | null;
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

function EditBatchModal({ isOpen, onClose, onSave, batch }: EditBatchModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    course_type: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (batch) {
      setFormData({
        name: batch.name,
        course_type: batch.course_type,
        start_date: batch.start_date,
        end_date: batch.end_date,
      });
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Batch</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <Plus className="h-5 w-5 transform rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Batch Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="input-field mt-1"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="course_type" className="block text-sm font-medium text-gray-700">
              Course Type
            </label>
            <select
              id="course_type"
              name="course_type"
              required
              className="input-field mt-1"
              value={formData.course_type}
              onChange={handleChange}
            >
              <option value="">Select a course type</option>
              <option value="Engineering">Engineering</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Entrance">Entrance</option>
              <option value="XI Coaching">XI Coaching</option>
              <option value="XII Coaching">XII Coaching</option>
            </select>
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              required
              className="input-field mt-1"
              value={formData.start_date}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              required
              className="input-field mt-1"
              value={formData.end_date}
              onChange={handleChange}
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
            <button type="submit" className="flex-1 btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    batchId?: string;
    batchName?: string;
  }>({ isOpen: false });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    batch: Batch | null;
  }>({ isOpen: false, batch: null });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    
    const { data, error } = await safeQuery(async () => 
      await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false })
    );
  
    if (!error) {
      setBatches(data || []);
    }
    
    setLoading(false);
  };
  

  const handleBatchCreated = () => {
    setIsCreateModalOpen(false);
    fetchBatches();
    toast.success('Batch created successfully');
  };

  const handleDeleteBatch = async () => {
    if (!deleteModal.batchId) return;

    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', deleteModal.batchId);

      if (error) throw error;

      toast.success('Batch deleted successfully');
      fetchBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error('Failed to delete batch');
    } finally {
      setDeleteModal({ isOpen: false });
    }
  };

  const handleEditBatch = async (updatedBatch: Omit<Batch, 'id' | 'created_at'>) => {
    if (!editModal.batch) return;

    try {
      const { error } = await supabase
        .from('batches')
        .update(updatedBatch)
        .eq('id', editModal.batch.id);

      if (error) throw error;

      toast.success('Batch updated successfully');
      fetchBatches();
      setEditModal({ isOpen: false, batch: null });
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error('Failed to update batch');
    }
  };

  const navigateToStudents = (batchId: string) => {
    navigate(`/batches/${batchId}/students`);
  };

  return (
    <div className="space-y-8 px-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">Batches</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your batches and student attendance</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          aria-label="Create new batch"
        >
          <Plus className="h-5 w-5" />
          New Batch
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-700">Loading batches...</div>
      ) : batches.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No batches found. Create your first batch to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{batch.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{batch.course_type}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditModal({ isOpen: true, batch })}
                    className="text-gray-400 hover:text-purple-500 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label={`Edit batch ${batch.name}`}
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, batchId: batch.id, batchName: batch.name })}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Delete batch ${batch.name}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm"><span className="text-gray-500">Start Date:</span> {new Date(batch.start_date).toLocaleDateString()}</p>
                <p className="text-sm"><span className="text-gray-500">End Date:</span> {new Date(batch.end_date).toLocaleDateString()}</p>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigateToStudents(batch.id)}
                  className="btn-secondary flex-1 px-4 py-2 rounded-lg text-purple-600 border border-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  View Students
                </button>
                <button
                  onClick={() => navigate(`/batches/${batch.id}/attendance`)}
                  className="btn-primary flex-1 px-4 py-2 rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Take Attendance
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateBatchModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onBatchCreated={handleBatchCreated} />

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleDeleteBatch}
        title="Delete Batch"
        message={`Are you sure you want to delete "${deleteModal.batchName}"? This will also delete all students and attendance records in this batch. This action cannot be undone.`}
      />

      <EditBatchModal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, batch: null })} onSave={handleEditBatch} batch={editModal.batch} />
    </div>
  );
}