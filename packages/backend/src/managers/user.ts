/* eslint-disable class-methods-use-this */
import { Provider, SSOAccountJSON, UserInfoJSON } from '@team-10/lib';
import { Socket } from 'socket.io';
import { getConnection, Repository } from 'typeorm';

import UserEntity from '../entity/user';

import Server from '../server';

interface UserEntry {
  info: SerializableUserInfo;
  sockets: Socket[]; // 제일 앞에 있는 게 main
}

interface SerializableUserInfo {
  id: number;
  stringId: string;
  ssoAccounts: SSOAccountJSON[];
  displayName: string;
  profileImage: string;
  initialized: boolean;
  classroomHashes: string[];
  myClassroomHashes: string[];
}

export default class UserManager {
  private users: Map<string, UserEntry> = new Map();

  constructor(public server: Server) {}

  // userId는 중복 가능
  async add(userId: string, socket: Socket): Promise<boolean> {
    const info = await this.getSerializableUserInfoFromStringId(userId);
    if (!info) return false;

    const entry = this.users.get(userId);
    if (!entry) {
      this.users.set(userId, {
        info,
        sockets: [socket],
      });
    } else {
      entry.sockets.push(socket);
    }

    return true;
  }

  remove(userId: string, socket: Socket): boolean {
    const entry = this.users.get(userId);
    if (!entry) return false;

    entry.sockets = entry.sockets.filter((s) => s.id !== socket.id);
    if (entry.sockets.length === 0) {
      this.users.delete(userId);
    }
    return true;
  }

  async refreshUserInfo(userId: string): Promise<boolean> {
    const entry = this.users.get(userId);
    if (!entry) return false;

    const info = await this.getSerializableUserInfoFromStringId(userId);
    if (!info) return false;

    entry.info = info;
    return true;
  }

  async getEntity(userId: string): Promise<UserEntity | null> {
    const userRepository = getConnection().getRepository(UserEntity);
    const user = await userRepository.findOne({
      where: { stringId: userId },
      join: {
        alias: 'user',
        leftJoinAndSelect: {
          classrooms: 'user.classrooms',
          myClassrooms: 'user.myClassrooms',
          ssoAccounts: 'user.ssoAccounts',
        },
      },
    });
    return user ?? null;
  }

  async getEntityOrFail(userId: string): Promise<UserEntity> {
    const user = await this.getEntity(userId);
    if (!user) {
      throw new Error('getEntityOrFail has failed.');
    }
    return user;
  }

  getSerializableUserInfoFromEntity(userEntity: UserEntity) {
    return {
      id: userEntity.id,
      stringId: userEntity.stringId,
      displayName: userEntity.displayName,
      profileImage: userEntity.profileImage,
      initialized: userEntity.initialized,
      ssoAccounts: userEntity.ssoAccounts.map(({ provider, providerId }) => ({
        provider: provider as Provider, providerId,
      })),
      classroomHashes: userEntity.classrooms.map((c) => c.hash),
      myClassroomHashes: userEntity.myClassrooms.map((c) => c.hash),
    };
  }

  getUserInfoJSONFromEntity(userEntity: UserEntity): UserInfoJSON {
    return {
      stringId: userEntity.stringId,
      displayName: userEntity.displayName,
      profileImage: userEntity.profileImage,
    };
  }

  async getSerializableUserInfoFromStringId(userId: string): Promise<SerializableUserInfo | null> {
    const userEntity = await this.getEntity(userId);

    return userEntity ? this.getSerializableUserInfoFromEntity(userEntity) : null;
  }
}
