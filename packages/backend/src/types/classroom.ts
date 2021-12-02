import Crypto from 'crypto';

import { YouTubeVideo } from '@team-10/lib';
import { getConnection } from 'typeorm';

import { TextChatEntity } from '../entity/chat';
import ClassroomEntity from '../entity/classroom';
import { ChatHistoryEntity, VoiceHistoryEntity } from '../entity/history';
import UserEntity from '../entity/user';
import Server from '../server';

export interface ClassroomVoiceState {
  speaker: string | null; // speaker's `stringId`
  startedAt: Date | null;
}

export interface ClassroomYouTubeState {
  responseTime: Date | null;
  videoId: string | null;
  currentTime: number | null;
  play: boolean;
}

export default class Classroom {
  /**
   * Information in the database
   */
  hash: string;

  name: string;

  instructor: UserEntity;

  // 등록된 멤버
  members: UserEntity[];

  passcode: string;

  updatedAt: Date;

  video: YouTubeVideo;

  isLive: boolean = false;

  /**
   * Internal states
   */
  // 현재 연결되어 있는 멤버
  connectedMemberIds: Set<string>;

  temporarilyDisconnectedMemberIds: Set<string>;

  temporaryDisconnectionTimeout: Map<string, ReturnType<typeof setTimeout>>;

  voice: ClassroomVoiceState;

  youtube: ClassroomYouTubeState;

  constructor(
    public server: Server,
    public entity: ClassroomEntity,
  ) {
    this.hash = this.entity.hash;
    this.name = this.entity.name;
    this.passcode = this.entity.passcode;
    this.instructor = this.entity.instructor;
    this.members = this.entity.members;
    this.updatedAt = this.entity.updatedAt;
    this.connectedMemberIds = new Set();
    this.voice = {
      speaker: null,
      startedAt: null,
    };
    this.youtube = {
      responseTime: null,
      videoId: null,
      currentTime: null,
      play: false,
    };
  }

  async connectMember(userId: string) {
    this.connectedMemberIds.add(userId);

    // TODO: 임시적으로 끊긴 유저라면 DB 접근 없이 timeout만 clear & delete하고,
    // TODO: 그렇지 않다면 DB에 출석 history entity 만들어서 저장하기
    /*
    if (this.temporarilyDisconnectedMemberIds.has(userId)) {
      clearTimeout(this.temporaryDisconnectionTimeout.get(userId)!);
      this.temporaryDisconnectionTimeout.delete(userId);
    } else {
      // make a DB entry: attendance history entity, attend
      // await attendanceEntity.save();
    }
    */

    // TODO: broadcast to others
  }

  disconnectMember(userId: string) {
    this.connectedMemberIds.delete(userId);

    // TODO: 임시적으로 끊긴 멤버 관리하기, 일정 timeout 이후에는 db에 나간 것으로 저장
    /*
    this.temporarilyDisconnectedMemberIds.add(userId);
    const timeout = setTimeout(async () => {
      this.temporarilyDisconnectedMemberIds.delete(userId);
      // make a DB entry: attendance history entity, disconnected
      await attendanceEntity.save();
    }, 60 * 1000);
    this.temporaryDisconnectionTimeout.set(userId, timeout);
    */

    // TODO: broadcast to others
  }

  hasMember(userId: string) {
    return this.members.some((member) => member.stringId === userId);
  }

  async letMemberJoin(userEntity: UserEntity) {
    await getConnection()
      .createQueryBuilder()
      .relation(UserEntity, 'classrooms')
      .of(userEntity)
      .add(this.entity.id);
    this.members.push(userEntity);

    // TODO: broadcast to others
  }

  async letMemberLeave(userEntity: UserEntity) {
    await getConnection()
      .createQueryBuilder()
      .relation(UserEntity, 'classrooms')
      .of(userEntity)
      .remove(this.entity.id);
    this.members.push(userEntity);

    // TODO: broadcast to others
  }

  async regeneratePasscode(): Promise<string> {
    this.passcode = Crypto.randomInt(1e6).toString().padStart(6, '0');
    this.entity.passcode = this.passcode;
    await this.entity.save();
    return this.passcode;

    // TODO: emit to the instructor only
  }

  async rename(name: string): Promise<void> {
    this.name = name;
    this.entity.name = name;
    await this.entity.save();

    // TODO: broadcast to others
  }

  async start() {
    this.isLive = true;
    this.updatedAt = new Date();
    this.entity.updatedAt = this.updatedAt;
    await this.entity.save();

    // TODO: create ClassHistoryEntity instance and save
    /*
    const classHistoryEntity = new ClassHistoryEntity();
    classHistoryEntity.start = true;
    classHistoryEntity.date = this.updatedAt;
    classHistoryEntity.classroom = this.entity;
    await classHistoryEntity.save();
    */

    // TODO: broadcast to others
  }

  async end() {
    this.isLive = false;
    this.updatedAt = new Date();
    this.entity.updatedAt = this.updatedAt;
    await this.entity.save();

    // TODO: create ClassHistoryEntity instance and save

    // TODO: broadcast to others
  }

  async recordVoiceHistory(
    speakerId: string,
    startedAt: Date,
    endedAt: Date,
  ) {
    const userEntity = this.members.find(({ stringId }) => stringId === speakerId);
    if (!userEntity) return false;

    const voiceHistoryEntity = new VoiceHistoryEntity();
    voiceHistoryEntity.classroom = this.entity;
    voiceHistoryEntity.speaker = userEntity;
    voiceHistoryEntity.startedAt = startedAt;
    voiceHistoryEntity.endedAt = endedAt;
    await voiceHistoryEntity.save();

    return true;
  }

  async recordChatHistory(
    senderId: string,
    // Pass chat information here
  ) {
    const userEntity = this.members.find(({ stringId }) => stringId === senderId);
    if (!userEntity) return false;

    // TODO: create chat entity instance (text or photo, or other type..?)
    // const chatEntity = new TextChatEntity();

    // create ChatHistoryEntity instance
    const chatHistoryEntity = new ChatHistoryEntity();

    // TODO: set appropriate information and save
    /*
    chatEntity.author = chat.author;
    chatEntity.text = chat.text;
    chatEntity.history = chatHistoryEntity;

    chatHistoryEntity.classroom = this.entity;
    chatHistoryEntity.sentAt = chat.sentAt;
    chatHistoryEntity.chat = chatEntity;

    await chatEntity.save();
    await chatHistoryEntity.save();
    */

    return true;
  }

  /**
   * 접속한 유저의 모든 소켓에 broadcast하는 method
   * @param eventName
   * @param message
   */
  broadcast<T>(eventName: string, message: T) {
    const sockets = Array.from(this.server.managers.user.users.values())
      .flatMap(({ sockets: userSockets }) => userSockets);
    sockets.forEach((socket) => {
      socket.emit(eventName, message);
    });
  }

  /**
   * 특정 유저를 제외하고 모든 소켓에 broadcast하는 method
   * @param eventName
   * @param message
   */
  broadcastExcept<T>(eventName: string, userIds: string[], message: T) {
    const sockets = Array.from(this.server.managers.user.users.values())
      .filter(({ info }) => !userIds.includes(info.stringId))
      .flatMap(({ sockets: userSockets }) => userSockets);
    sockets.forEach((socket) => {
      socket.emit(eventName, message);
    });
  }

  /**
   * 접속한 유저의 소켓 중 main 소켓에만 broadcast하는 method
   * @param eventName
   * @param message
   */
  broadcastMain<T>(eventName: string, message: T) {
    const sockets = Array.from(this.server.managers.user.users.values())
      .map(({ sockets: userSockets }) => userSockets[0])
      .filter((socket) => !!socket);
    sockets.forEach((socket) => {
      socket.emit(eventName, message);
    });
  }

  /**
   * 특정 유저를 제외하고 main 소켓에 broadcast하는 method
   * @param eventName
   * @param message
   */
  broadcastMainExcept<T>(eventName: string, userIds: string[], message: T) {
    const sockets = Array.from(this.server.managers.user.users.values())
      .filter(({ info }) => !userIds.includes(info.stringId))
      .map(({ sockets: userSockets }) => userSockets[0])
      .filter((socket) => !!socket);
    sockets.forEach((socket) => {
      socket.emit(eventName, message);
    });
  }
}
