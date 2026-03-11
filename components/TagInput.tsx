'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Tag } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}

export function TagInput({
  tags,
  onChange,
  maxTags = 10,
  placeholder = '添加标签...',
}: TagInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 获取标签建议
  useEffect(() => {
    if (input.length >= 1) {
      fetch(`/api/tags?q=${encodeURIComponent(input)}&limit=5`)
        .then((res) => res.json())
        .then((data) => {
          if (data.tags) {
            // 过滤已添加的标签
            const filtered = data.tags.filter(
              (t: { name: string }) => !tags.includes(t.name)
            );
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
          }
        })
        .catch(console.error);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input, tags]);

  const addTag = useCallback(
    (tagName: string) => {
      const normalized = tagName.toLowerCase().trim();
      if (
        normalized &&
        !tags.includes(normalized) &&
        tags.length < maxTags
      ) {
        onChange([...tags, normalized]);
      }
      setInput('');
      setShowSuggestions(false);
    },
    [tags, onChange, maxTags]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(tags.filter((tag) => tag !== tagToRemove));
    },
    [tags, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="w-full">
      {/* 已添加的标签 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full"
            >
              <Tag className="h-3 w-3" />
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div 
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => input.length >= 1 && suggestions.length > 0 && setShowSuggestions(true)}
            onClick={(e) => e.stopPropagation()}
            placeholder={
              tags.length < maxTags
                ? placeholder
                : `最多 ${maxTags} 个标签`
            }
            disabled={tags.length >= maxTags}
            className="flex-1 min-w-0 outline-none text-sm disabled:cursor-not-allowed"
          />
          <span className="text-xs text-gray-400 flex-shrink-0">
            {tags.length}/{maxTags}
          </span>
        </div>

        {/* 建议列表 */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => addTag(suggestion.name)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
              >
                {suggestion.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-1.5 text-xs text-gray-500">
        按回车添加标签，最多 {maxTags} 个
      </p>
    </div>
  );
}
