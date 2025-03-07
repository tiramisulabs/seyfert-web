'use client';

import { File01Icon, FolderOpenIcon, JavaScriptIcon, Settings01Icon, Typescript01Icon } from 'hugeicons-react';
import { FileJson, FolderIcon } from 'lucide-react';
import React, { useState } from 'react';

interface FileProps {
    name: string;
    children?: React.ReactNode;
}

interface FolderProps {
    name: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

const iconClass = 'text-gray-500 dark:text-gray-300 size-4';
const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'js':
            return <JavaScriptIcon className={iconClass} />;
        case 'ts':
            return <Typescript01Icon className={iconClass} />;
        case 'json':
            return <FileJson className={iconClass} />;
        case 'env':
            return <Settings01Icon className={iconClass} />;
        case 'mjs':
            return <JavaScriptIcon className={iconClass} />;
        default:
            return <File01Icon className={iconClass} />;
    }
};

export const File: React.FC<FileProps> = ({ name }) => {
    const icon = getFileIcon(name);

    return (
        <div className="flex items-center py-1 pl-2">
            <span className="mr-2">{icon}</span>
            <span>{name}</span>
        </div>
    );
};

export const Folder: React.FC<FolderProps> = ({ name, defaultOpen = false, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div>
            <div
                className="flex items-center py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#232327] pl-2 rounded transition-all duration-200"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="mr-2">
                    {isOpen ?
                        <FolderOpenIcon className={iconClass} /> :
                        <FolderIcon className={iconClass} />
                    }
                </span>
                <span>{name}</span>
            </div>
            {isOpen && (
                <div className="ml-4 border-l border-gray-200 dark:border-[#333336] pl-2">
                    {children}
                </div>
            )}
        </div>
    );
};

export const Files: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="font-mono text-sm border rounded-md p-4 bg-white dark:bg-card dark:border-[#333336] dark:text-white">
            {children}
        </div>
    );
};
