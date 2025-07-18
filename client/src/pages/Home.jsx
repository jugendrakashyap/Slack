import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Eye, MessageSquare, ThumbsUp, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTags, setSelectedTags] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  // Fetch questions from API
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: '10',
        sort: sortBy
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }

      console.log('Fetching questions with URL:', `/questions?${params}`);
      const response = await axios.get(`/questions?${params}`);
      console.log('API Response:', response.data);
      const { questions: fetchedQuestions, pagination: paginationData } = response.data;

      // Transform the data to match frontend expectations
      const transformedQuestions = fetchedQuestions.map(question => ({
        id: question._id,
        title: question.title,
        description: question.description,
        author: {
          username: question.author.username,
          reputation: question.author.reputation
        },
        tags: question.tags,
        views: question.views,
        answerCount: question.answers?.length || 0,
        voteScore: (question.votes?.upvotes?.length || 0) - (question.votes?.downvotes?.length || 0),
        createdAt: new Date(question.createdAt),
        hasAcceptedAnswer: !!question.acceptedAnswer
      }));

      console.log('Transformed questions:', transformedQuestions);
      setQuestions(transformedQuestions);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [sortBy, pagination.current]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.current !== 1) {
        setPagination(prev => ({ ...prev, current: 1 }));
      } else {
        fetchQuestions();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedTags]);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const availableTags = ['react', 'javascript', 'mongodb', 'node.js', 'express', 'authentication', 'security', 'performance', 'hooks', 'aggregation', 'jwt'];

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag];
      return newTags;
    });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, current: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Questions</h1>
          <p className="text-gray-600">
            {pagination.total} questions found
          </p>
        </div>
        {isAuthenticated && (
          <Link
            to="/ask"
            className="mt-4 md:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Ask Question</span>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="votes">Most Voted</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No questions found.</p>
          {isAuthenticated && (
            <Link
              to="/ask"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Ask the first question
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Question Title */}
                  <Link
                    to={`/questions/${question.id}`}
                    className="text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2 block"
                  >
                    {question.title}
                    {question.hasAcceptedAnswer && (
                      <span className="ml-2 text-green-600 text-sm">✓ Solved</span>
                    )}
                  </Link>

                  {/* Question Description Preview */}
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {question.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Author and Time */}
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Asked by</span>
                    <Link
                      to={`/profile/${question.author.username}`}
                      className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {question.author.username}
                    </Link>
                    <span className="mx-2">•</span>
                    <Clock size={14} className="mr-1" />
                    <span>{formatTimeAgo(question.createdAt)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="ml-6 flex flex-col items-center space-y-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <ThumbsUp size={16} />
                    <span>{question.voteScore}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare size={16} />
                    <span>{question.answerCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye size={16} />
                    <span>{question.views}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && questions.length > 0 && pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(pagination.pages - 4, pagination.current - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg ${
                    pageNum === pagination.current
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
