'use client';

import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon, FolderOpenIcon, JavaScriptIcon, Settings01Icon, Typescript01Icon } from '@hugeicons/core-free-icons';
import { FileJson, FolderIcon } from 'lucide-react';
import React, { useState } from 'react';

interface FileProps {
    name: string;
    children?: React.ReactNode;
    comment?: string;
}

interface FolderProps {
    name: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
    comment?: string;
}

const iconClass = 'text-gray-500 dark:text-gray-300 size-4';
const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'js':
            return <HugeiconsIcon icon={JavaScriptIcon} className={iconClass} />;
        case 'ts':
            return <HugeiconsIcon icon={Typescript01Icon} className={iconClass} />;
        case 'json':
            return <FileJson className={iconClass} />;
        case 'env':
            return <HugeiconsIcon icon={Settings01Icon} className={iconClass} />;
        case 'mjs':
            return <HugeiconsIcon icon={JavaScriptIcon} className={iconClass} />;
        default:
            return <HugeiconsIcon icon={File01Icon} className={iconClass} />;
    }
};

export const File: React.FC<FileProps> = ({ name, comment }) => {
    const icon = getFileIcon(name);

    return (
        <div className="flex items-center py-1 pl-2 group">
            <span className="mr-2">{icon}</span>
            <span>{name}</span>
            {comment && (
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 italic">
                    {comment}
                </span>
            )}
        </div>
    );
};

export const Folder: React.FC<FolderProps> = ({ name, defaultOpen = false, children, comment }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div>
            <div
                className="flex items-center py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#232327] pl-2 rounded transition-all duration-200 group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="mr-2">
                    {isOpen ?
                        <HugeiconsIcon icon={FolderOpenIcon} className={iconClass} /> :
                        <FolderIcon className={iconClass} />
                    }
                </span>
                <span>{name}</span>
                {comment && (
                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 italic">
                        {comment}
                    </span>
                )}
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
