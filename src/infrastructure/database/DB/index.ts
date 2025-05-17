// src/infrastructure/database/mongo.database.ts
import mongoose from 'mongoose';
import { config } from '../../../core/config/app.config';

export const connectDB = async (): Promise<void> => {
    try {
        if (!config.MONGO_URI) {
            throw new Error('MongoDB URI not configured');
        }

        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB connection already established');
            
            // logger.info('Using existing MongoDB connection');
            return;
        }

        await mongoose.connect(config.MONGO_URI, {
            autoIndex: config.NODE_ENV === 'development',
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 30000,
            family: 4,
            heartbeatFrequencyMS: 10000,
        });

        // logger.info('MongoDB connected successfully');
        console.log('MongoDB connected successfully');

        mongoose.connection.on('error', (error) => {
            // logger.error('MongoDB runtime error:', error);
            console.error('MongoDB runtime error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            // logger.warn('MongoDB connection lost');
            console.warn('MongoDB connection lost');
        });

        process.on('SIGINT', async () => {
            await mongoose.disconnect();
            // logger.info('MongoDB connection closed due to app termination');
            console.log('MongoDB connection closed due to app termination');
            
            process.exit(0);
        });

    } catch (error) {
        // logger.error('Critical MongoDB connection error:', error);
        console.error('Critical MongoDB connection error:', error);
        process.exit(1);
    }
};

export const disconnectDB = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        // logger.info('MongoDB connection closed gracefully');
        console.log('MongoDB connection closed gracefully');
    } catch (error) {
        // logger.error('Error closing MongoDB connection:', error);
        console.error('Error closing MongoDB connection:', error);
    }
};