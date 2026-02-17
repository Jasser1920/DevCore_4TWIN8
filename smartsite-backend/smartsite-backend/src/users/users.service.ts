// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<User>) {}

  async createUser(userData: any) {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async getUserByUsername(username: string) {
    return this.userModel.findOne({ username });
  }

  async getUserByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async getUserById(id: string) {
    return this.userModel.findById(id);
  }

  async updateUser(id: string, updateData: any) {
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteUser(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}