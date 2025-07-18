import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const AskQuestion = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle tag input changes
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  // Handle tag input on Enter or comma
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // Add tag to the list
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  // Remove tag from the list
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim() || formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters long';
    }

    if (!formData.description.trim() || formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters long';
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/questions', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags: formData.tags
      });

      toast.success('Question posted successfully!');
      navigate(`/questions/${response.data.question._id}`);
    } catch (error) {
      console.error('Error creating question:', error);
      if (error.response?.data?.errors) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          apiErrors[err.path || err.param] = err.msg;
        });
        setErrors(apiErrors);
      } else {
        toast.error(error.response?.data?.message || 'Failed to create question');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Ask a Question</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Question Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="What's your programming question? Be specific."
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className={`border rounded-md min-h-[300px] p-4 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}>
              <p className="text-gray-500 mb-2">Rich text editor will be implemented here with TipTap</p>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full h-64 border-0 resize-none focus:ring-0 focus:outline-none"
                placeholder="Provide details about your question. Include what you've tried and what you expect to happen."
              />
            </div>
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags ({formData.tags.length}/5)
            </label>

            {/* Display current tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              id="tags"
              name="tags"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              onBlur={addTag}
              disabled={formData.tags.length >= 5}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.tags ? 'border-red-500' : 'border-gray-300'
              } ${formData.tags.length >= 5 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder={formData.tags.length >= 5 ? 'Maximum 5 tags reached' : 'Add up to 5 tags (e.g., react, javascript, hooks)'}
            />
            <p className="text-sm text-gray-500 mt-1">
              Press Enter or comma to add a tag. Tags help others find and answer your question.
            </p>
            {errors.tags && (
              <p className="text-red-500 text-sm mt-1">{errors.tags}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 text-white rounded-md font-medium ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AskQuestion;
