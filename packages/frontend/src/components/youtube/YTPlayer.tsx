import { SocketYouTube } from '@team-10/lib';
import React, { useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';

import { useRecoilState } from 'recoil';
import { YouTubePlayer } from 'youtube-player/dist/types';

import useSize from '../../hooks/useSize';
import useSocket from '../../hooks/useSocket';
import videoState from '../../recoil/video';
import { mergeClassNames, mergeStyles, Styled } from '../../utils/style';

import styles from './YTPlayer.module.css';

interface Props {
  videoId?: string | null;
  options?: YouTubeProps['opts'];
  classroomHash?: string;
  instructor?: boolean;
}

const YTPlayer: React.FC<Styled<Props>> = ({
  style, className, videoId, options = {}, classroomHash, instructor,
}) => {
  const aspectRatio = 16 / 9;

  const ref = React.useRef<HTMLDivElement>(null);
  const size = useSize(ref);

  const [playStatus, setPlayStatus] = useRecoilState(videoState.statusSelector);
  const [volume, setVolume] = useRecoilState(videoState.volumeSelector);
  const [currentTime, setCurrentTime] = useRecoilState(videoState.timeSelector);
  const [player, setPlayer] = React.useState<YouTubePlayer | undefined>(undefined);
  const { socket, connected } = useSocket<SocketYouTube.Events.Response, SocketYouTube.Events.Request>('/youtube');
  console.log('connected : ', connected);
  console.log('connected socket id :', socket.id);
  const onReadyHandler = (target: YouTubePlayer) => {
    setPlayer(target);
  };

  const onStateChangeHandler = (target: YouTubePlayer, data: number) => {
    if (instructor) {
      if (data === YouTube.PlayerState.PLAYING) {
        socket.emit('ChangeTime', {
          classroomHash: classroomHash || '',
          play: true,
          videoId,
          timeInYouTube: player?.getCurrentTime(),
        });
        socket.emit('ChangePlayStatus', {
          classroomHash: classroomHash || '',
          play: true,
          videoId,
          timeInYouTube: player?.getCurrentTime(),
        });
        setPlayStatus('playing');
      } else if (data === YouTube.PlayerState.PAUSED) {
        socket.emit('ChangePlayStatus', {
          classroomHash: classroomHash || '',
          play: false,
          videoId,
          timeInYouTube: player?.getCurrentTime(),
        });
        setPlayStatus('paused');
      }
      setCurrentTime(player?.getCurrentTime() || 0);
    }
  };
  // when join class room now
  useEffect(() => {
    socket.emit('JoinClassroom', {
      classroomHash: classroomHash || '',
      userId: socket.id,
      isInstructor: instructor || false,
    });
    console.log('join : ', instructor);
  }, [connected, player]);

  // when receive broadcast request
  useEffect(() => {
    socket.on('CurrentVideoPosition', ({
      userId,
    }: SocketYouTube.Response.CurrentVideoPosition) => {
      console.log('send current info');
      if (instructor) {
        socket.emit('CurrentVideoPosition', {
          userId,
          classroomHash: classroomHash || '',
          play: player?.getPlayerState() === YouTube.PlayerState.PLAYING,
          videoId,
          timeInYouTube: player?.getCurrentTime(),
        });
      }
    });
    socket.on('ChangePlayStatusBroadcast', ({
      play, timeInYouTube,
    }: SocketYouTube.Broadcast.ChangePlayStatus) => {
      if (play) {
        console.log('player : ', player);
        player?.playVideo();
        setPlayStatus('playing');
        console.log('play!!');
      } else {
        player?.pauseVideo();
        setPlayStatus('paused');
        console.log('pause!!');
      }
      console.log('on play status change');
    });
    socket.on('ChangeTimeBroadcast', ({
      play, timeInYouTube,
    }: SocketYouTube.Broadcast.ChangeTime) => {
      if (timeInYouTube !== undefined) {
        player?.seekTo(timeInYouTube, false);
        setCurrentTime(timeInYouTube);
      }
    });
  }, [socket, player]);

  return (
    <div
      style={mergeStyles(style)}
      className={mergeClassNames(
        'w-full h-full flex justify-center items-center overflow-hidden',
        className,
        'bg-black',
      )}
      ref={ref}
    >
      <div style={{
        height: size ? Math.min(size.height, size.width / aspectRatio) : '100%',
        width: size ? Math.min(size.width, size.height * aspectRatio) : '100%',
      }}
      >
        {(!!videoId || !!options?.playerVars?.list) ? (
          <YouTube
            videoId={videoId ?? undefined}
            containerClassName={styles.youtubeContainer}
            opts={{
              height: '100%',
              width: '100%',
              ...options,
            }}
            onReady={({ target: youtubePlayer }) => {
              onReadyHandler(youtubePlayer);
            }}
            onStateChange={({ target: youtubePlayer, data: state }) => {
              onStateChangeHandler(youtubePlayer, state);
            }}
          />
        ) : (
          <div className="w-full h-full flex justify-center items-center text-white">
            No videos are shared.
          </div>
        )}
      </div>
    </div>
  );
};

export default YTPlayer;
