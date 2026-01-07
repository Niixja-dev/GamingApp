import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLocale } from '../i18n';

const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = '@app_language';

export const LanguageProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState({ code: 'EN', flag: '🇬🇧', label: 'English' });
    const [isLoading, setIsLoading] = useState(true);

    // Load saved language on mount
    useEffect(() => {
        loadSavedLanguage();
    }, []);

    const loadSavedLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLanguage) {
                const lang = JSON.parse(savedLanguage);
                setCurrentLanguage(lang);
                setLocale(lang.code.toLowerCase());
            }
        } catch (error) {
            console.error('Error loading saved language:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const changeLanguage = async (language) => {
        try {
            // Update state
            setCurrentLanguage(language);

            // Update i18n locale
            setLocale(language.code.toLowerCase());

            // Persist to AsyncStorage
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(language));
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    return (
        <LanguageContext.Provider value={{ currentLanguage, changeLanguage, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
