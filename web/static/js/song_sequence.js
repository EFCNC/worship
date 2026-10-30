const SongSequence = {
    rules: [
        { canonical: 'verse', prefix: 'v', label: 'Verse' },
        { canonical: 'chorus', prefix: 'c', label: 'Chorus' },
        { canonical: 'bridge', prefix: 'b', label: 'Bridge' },
        { canonical: 'prechorus', prefix: 'pre', label: 'Pre-Chorus' },
        { canonical: 'postchorus', prefix: 'post', label: 'Post-Chorus' },
        { canonical: 'tag', prefix: 'tag', label: 'Tag' },
        { canonical: 'vamp', prefix: 'vamp', label: 'Vamp' },
        { canonical: 'intro', prefix: 'in', label: 'Intro' },
        { canonical: 'outro', prefix: 'out', label: 'Outro' },
        { canonical: 'interlude', prefix: 'inst', label: 'Interlude' },
        { canonical: 'instrumental', prefix: 'inst', label: 'Instrumental' }
    ],

    parseToken(rawToken) {
        if (!rawToken) return null;
        const token = rawToken.trim().toLowerCase();
        const match = token.match(/^([a-z\-]+)(\d*)$/);

        if (match) {
            const prefix = match[1];
            const number = match[2];
            const rule = this.rules.find(item => item.prefix === prefix || item.canonical === prefix);
            if (rule) {
                return {
                    tag: rawToken,
                    sectionName: rule.canonical,
                    index: number ? Math.max(0, parseInt(number, 10) - 1) : 0,
                    displayHeader: `${rule.label}${number ? ` ${number}` : ''}`
                };
            }
        }

        return { tag: rawToken, sectionName: token, index: 0, displayHeader: rawToken };
    },

    getShortTag(sectionName, index, totalCount) {
        const cleanName = sectionName.toLowerCase().replace('-', '');
        const rule = this.rules.find(item => item.canonical === cleanName);
        const prefix = rule ? rule.prefix : cleanName;
        return totalCount > 1 ? `${prefix}${index + 1}` : prefix;
    },

    findSection(block, sectionName) {
        if (!block || !Array.isArray(block.lyrics)) return null;
        const target = sectionName.toLowerCase().replace('-', '');
        return block.lyrics.find(section => section.name &&
            section.name.toLowerCase().replace('-', '') === target) || null;
    },

    getLyricText(contentArray, sectionName, index, lang1Code, lang2Code) {
        if (!Array.isArray(contentArray) || contentArray.length === 0) {
            return { lang1: '', lang2: '' };
        }

        const primaryBlock = contentArray.find(block => block.lang === lang1Code) || contentArray[0];
        const secondaryBlock = contentArray.find(block => block.lang === lang2Code) ||
            (contentArray.length > 1 ? contentArray[1] : null);

        const extractText = section => {
            if (!section) return '';
            const lines = section.lyrics_text || section.lyrics || [];
            if (Array.isArray(lines)) return lines[index] !== undefined ? lines[index] : (lines[0] || '');
            return typeof lines === 'string' ? lines : '';
        };

        return {
            lang1: extractText(this.findSection(primaryBlock, sectionName)),
            lang2: extractText(this.findSection(secondaryBlock, sectionName))
        };
    },

    parseSequence(rawSequence, primaryBlock, options = {}) {
        const { fullSequence = false } = options;
        const sequenceItems = [];
        const seenKeys = new Set();
        const tokens = (rawSequence || '').trim().split(',').map(token => token.trim()).filter(Boolean);

        if (tokens.length === 0) {
            if (primaryBlock && Array.isArray(primaryBlock.lyrics)) {
                for (const section of primaryBlock.lyrics) {
                    const lines = section.lyrics_text || section.lyrics || [];
                    const count = Array.isArray(lines) ? lines.length : 1;
                    for (let index = 0; index < count; index++) {
                        sequenceItems.push({
                            name: section.name,
                            index,
                            label: this.getDisplayLabel(section.name, section.name, index, count)
                        });
                    }
                }
            }
            return sequenceItems;
        }

        for (const token of tokens) {
            const parsed = this.parseToken(token);
            if (!parsed) continue;
            const itemKey = `${parsed.sectionName.toLowerCase()}_${parsed.index}`;
            if (!fullSequence && seenKeys.has(itemKey)) continue;
            seenKeys.add(itemKey);

            const section = this.findSection(primaryBlock, parsed.sectionName);
            const lines = section ? (section.lyrics_text || section.lyrics) : null;
            const count = Array.isArray(lines) ? lines.length : 1;
            sequenceItems.push({
                name: parsed.sectionName,
                index: parsed.index,
                label: this.getDisplayLabel(token, parsed.sectionName, parsed.index, count)
            });
        }

        return sequenceItems;
    },

    getDisplayLabel(rawToken, canonicalName, index, totalCount) {
        const rule = this.rules.find(item => item.canonical === canonicalName.toLowerCase());
        const base = rule ? rule.label : canonicalName;
        return totalCount > 1 || /\d+$/.test(rawToken) ? `${base} ${index + 1}` : base;
    }
};