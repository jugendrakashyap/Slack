import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Calendar, Award, MessageSquare, HelpCircle } from 'lucide-react';

const Profile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock API call - will be replaced with actual API
    setTimeout(() => {
      setUser({
        id: 1,
        username: "john_doe",
        email: "john@example.com",
        reputation: 150,
        bio: "Full-stack developer passionate about React and Node.js. Always learning new technologies!",
        joinedAt: new Date('2023-01-15'),
        questionCount: 5,
        answerCount: 12,
        recentQuestions: [
          {
            id: 1,
            title: "How to use React hooks effectively?",
            views: 45,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
          },
          {
            id: 2,
            title: "Best practices for Node.js error handling",
            views: 23,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
          }
        ],
        recentAnswers: [
          {
            id: 1,
            question: { title: "MongoDB aggregation pipeline optimization" },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12)
          },
          {
            id: 2,
            question: { title: "JWT authentication best practices" },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36)
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">User not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
            <User size={48} className="text-white" />
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.username}</h1>
            {user.bio && (
              <p className="text-gray-600 mb-4">{user.bio}</p>
            )}
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>Joined {formatDate(user.joinedAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Award size={16} />
                <span>{user.reputation} reputation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <HelpCircle className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-2">{user.questionCount}</p>
          <p className="text-gray-600">Questions asked</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <MessageSquare className="text-green-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Answers</h2>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-2">{user.answerCount}</p>
          <p className="text-gray-600">Answers provided</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Questions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Questions</h2>
          {user.recentQuestions.length === 0 ? (
            <p className="text-gray-500">No questions yet.</p>
          ) : (
            <div className="space-y-4">
              {user.recentQuestions.map((question) => (
                <div key={question.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer mb-2">
                    {question.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{question.views} views</span>
                    <span>{formatTimeAgo(question.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Answers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Answers</h2>
          {user.recentAnswers.length === 0 ? (
            <p className="text-gray-500">No answers yet.</p>
          ) : (
            <div className="space-y-4">
              {user.recentAnswers.map((answer) => (
                <div key={answer.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer mb-2">
                    {answer.question.title}
                  </h3>
                  <div className="text-sm text-gray-500">
                    <span>Answered {formatTimeAgo(answer.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
