const VideoTile = ({ name }) => {
  return (
    <div className="bg-gray-200 rounded-lg p-4 flex flex-col items-center justify-center h-48">
      <div className="bg-gray-400 w-20 h-20 rounded-full mb-2"></div>
      <p className="font-medium">{name}</p>
    </div>
  );
};

export default VideoTile;
