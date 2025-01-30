import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCreated: () => void;
}

export default function CreateBatchModal({
  isOpen,
  onClose,
  onBatchCreated,
}: CreateBatchModalProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    course_type: '',
    start_date: '',
    end_date: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('batches').insert([
        {
          ...formData,
          created_by: session?.user.id,
        },
      ]);

      if (error) throw error;
      onBatchCreated();
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create New Batch</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
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
              placeholder="e.g., Morning Batch 2024"
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
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}