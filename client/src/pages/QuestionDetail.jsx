import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, MessageSquare, Eye, Clock, Check } from 'lucide-react';

const QuestionDetail = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock API call - will be replaced with actual API
    setTimeout(() => {
      setQuestion({
        id: 1,
        title: "How to use React hooks effectively?",
        description: `<p>I'm new to React hooks and wondering about best practices. I've been using class components for a while, but I want to transition to functional components with hooks.</p>
        
        <p>Specifically, I'm confused about:</p>
        <ul>
          <li>When to use useEffect vs useLayoutEffect</li>
          <li>How to properly handle cleanup in useEffect</li>
          <li>Best practices for custom hooks</li>
        </ul>
        
        <p>Any guidance would be appreciated!</p>`,
        author: { 
          id: 1,
          username: "john_doe", 
          reputation: 150,
          joinedAt: new Date('2023-01-15')
        },
        tags: ["react", "hooks", "javascript"],
        views: 45,
        voteScore: 8,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        answers: [
          {
            id: 1,
            content: `<p>Great question! Here are some best practices for React hooks:</p>
            
            <h3>useEffect vs useLayoutEffect</h3>
            <p>Use <code>useEffect</code> for most side effects. Use <code>useLayoutEffect</code> only when you need to make DOM mutations that the user should not see.</p>
            
            <h3>Cleanup in useEffect</h3>
            <pre><code>useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);</code></pre>`,
            author: { username: "react_expert", reputation: 2500 },
            voteScore: 12,
            isAccepted: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 15)
          },
          {
            id: 2,
            content: `<p>I'd also add that custom hooks are a great way to share stateful logic between components:</p>
            
            <pre><code>function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  
  return { count, increment, decrement };
}</code></pre>`,
            author: { username: "hooks_fan", reputation: 890 },
            voteScore: 5,
            isAccepted: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 10)
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [id]);

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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading question...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Question not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start space-x-6">
          {/* Vote buttons */}
          <div className="flex flex-col items-center space-y-2">
            <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
              <ThumbsUp size={24} />
            </button>
            <span className="text-xl font-semibold text-gray-900">{question.voteScore}</span>
            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
              <ThumbsDown size={24} />
            </button>
          </div>

          {/* Question content */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{question.title}</h1>
            
            <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: question.description }} />

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Question meta */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Eye size={16} />
                  <span>{question.views} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={16} />
                  <span>Asked {formatTimeAgo(question.createdAt)}</span>
                </div>
              </div>
              <div className="text-right">
                <p>Asked by <span className="font-medium text-blue-600">{question.author.username}</span></p>
                <p>{question.author.reputation} reputation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {question.answers.length} Answer{question.answers.length !== 1 ? 's' : ''}
        </h2>

        {question.answers.map((answer) => (
          <div key={answer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-start space-x-6">
              {/* Vote buttons */}
              <div className="flex flex-col items-center space-y-2">
                <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                  <ThumbsUp size={20} />
                </button>
                <span className="text-lg font-semibold text-gray-900">{answer.voteScore}</span>
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                  <ThumbsDown size={20} />
                </button>
                {answer.isAccepted && (
                  <div className="p-2 text-green-600 bg-green-50 rounded" title="Accepted Answer">
                    <Check size={20} />
                  </div>
                )}
              </div>

              {/* Answer content */}
              <div className="flex-1">
                <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: answer.content }} />

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>Answered {formatTimeAgo(answer.createdAt)}</span>
                  </div>
                  <div className="text-right">
                    <p>By <span className="font-medium text-blue-600">{answer.author.username}</span></p>
                    <p>{answer.author.reputation} reputation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Answer form placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Answer</h3>
          <div className="border border-gray-300 rounded-md min-h-[200px] p-4 mb-4">
            <p className="text-gray-500">Rich text editor for answers will be implemented here</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Post Your Answer
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetail;
