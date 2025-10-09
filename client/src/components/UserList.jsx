
const UserList = ({ users }) => {
  return (
    <div>
      {users.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No participants yet</p>
      ) : (
        <ul className="space-y-2">
          {users.map((user) => (
            <li 
              key={user.socketId || user.id} 
              className="border-b border-gray-200 pb-2 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{user.name}</span>
                <div className="flex items-center gap-2">
                  {/* Mic status */}
                  <span 
                    className={`text-xs ${user.mic ? 'text-green-600' : 'text-red-600'}`}
                    title={user.mic ? 'Mic on' : 'Mic off'}
                  >
                    {user.mic ? '🎤' : '🔇'}
                  </span>
                  
                  {/* Video status */}
                  <span 
                    className={`text-xs ${user.video ? 'text-green-600' : 'text-red-600'}`}
                    title={user.video ? 'Video on' : 'Video off'}
                  >
                    {user.video ? '📹' : '📴'}
                  </span>
                  
                  {/* Speaking indicator */}
                  {user.speaking && (
                    <span className="text-xs text-blue-600 animate-pulse" title="Speaking">
                      🗣️
                    </span>
                  )}
                </div>
              </div>
              
              {/* Speaking time */}
              {user.speakingTime > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Spoke: {Math.round(user.speakingTime / 1000)}s
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;