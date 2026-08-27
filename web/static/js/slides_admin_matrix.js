(function () {
    'use strict';

    var generalView = false;
    var dragging = false;
    var suppressNextLoadRender = false;
    var uidCounter = 0;
    var objectIds = new WeakMap();

    function stableObjectId(object, prefix) {
        if (!object || typeof object !== 'object') {
            return prefix + '-missing';
        }
        if (!objectIds.has(object)) {
            uidCounter += 1;
            objectIds.set(object, prefix + '-' + uidCounter);
        }
        return objectIds.get(object);
    }

    function getVerticalSections(horizontalIndex) {
        var root = document.querySelector('.reveal .slides > section:nth-child(' + (horizontalIndex + 1) + ')');
        if (!root) {
            return [];
        }
        var children = Array.from(root.children).filter(function (child) {
            return child.tagName === 'SECTION';
        });
        return children.length ? children : [root];
    }

    function sectionContentIndex(section) {
        var value = Number(section.getAttribute('order'));
        return Number.isInteger(value) ? value : 0;
    }

    function captureSelection() {
        var slide = slides[pos];
        var descriptor = {
            slide: slide,
            horizontalIndex: pos,
            verticalIndex: order,
            content: null,
            fragmentOffset: 0
        };

        if (!slide || !Array.isArray(slide.content)) {
            return descriptor;
        }

        var sections = getVerticalSections(pos);
        var contentIndex = sections[order] ? sectionContentIndex(sections[order]) : 0;
        descriptor.content = slide.content[contentIndex] || null;
        descriptor.fragmentOffset = sections.slice(0, order).filter(function (section) {
            return sectionContentIndex(section) === contentIndex;
        }).length;
        return descriptor;
    }

    function resolveSelection(descriptor) {
        if (!slides.length) {
            return { h: 0, v: 0 };
        }

        descriptor = descriptor || captureSelection();
        var horizontalIndex = slides.indexOf(descriptor.slide);
        if (horizontalIndex < 0) {
            horizontalIndex = Math.max(0, Math.min(descriptor.horizontalIndex || 0, slides.length - 1));
        }

        var verticalSections = getVerticalSections(horizontalIndex);
        var verticalIndex = Math.max(0, Math.min(descriptor.verticalIndex || 0, Math.max(0, verticalSections.length - 1)));
        var selectedSlide = slides[horizontalIndex];

        if (descriptor.content && selectedSlide && Array.isArray(selectedSlide.content)) {
            var contentIndex = selectedSlide.content.indexOf(descriptor.content);
            if (contentIndex >= 0) {
                var matchingIndexes = [];
                verticalSections.forEach(function (section, index) {
                    if (sectionContentIndex(section) === contentIndex) {
                        matchingIndexes.push(index);
                    }
                });
                if (matchingIndexes.length) {
                    verticalIndex = matchingIndexes[Math.min(descriptor.fragmentOffset, matchingIndexes.length - 1)];
                }
            }
        }

        return { h: horizontalIndex, v: verticalIndex };
    }

    function makeElement(tag, className) {
        var element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        return element;
    }

    function plainText(value) {
        var holder = document.createElement('div');
        holder.innerHTML = value || '';
        return holder.textContent.trim();
    }

    function makeThumbnail(slide, section, horizontalIndex, verticalIndex, pageId) {
        var thumbnail = makeElement('div', 'matrix-thumbnail');
        thumbnail.setAttribute('role', 'button');
        thumbnail.setAttribute('tabindex', '0');
        thumbnail.setAttribute('aria-label', 'Select slide ' + (horizontalIndex + 1) + ', page ' + (verticalIndex + 1));
        thumbnail.dataset.horizontalIndex = horizontalIndex;
        thumbnail.dataset.verticalIndex = verticalIndex;
        thumbnail.dataset.pageId = pageId;

        var stage = makeElement('div', 'matrix-thumbnail-stage');
        var background = makeElement('div', 'matrix-thumbnail-background');
        var style = slide.style || {};
        if (style.background) {
            background.style.backgroundImage = 'url("' + String(style.background).replace(/"/g, '\\"') + '")';
        }
        background.style.opacity = 1;
        background.style.filter = 'brightness(' + get_slide_background_brightness(slide) + ')';

        var canvas = makeElement('div', 'matrix-thumbnail-canvas');
        Array.from(section.children).forEach(function (child) {
            var clone = child.cloneNode(true);
            clone.removeAttribute('contenteditable');
            clone.querySelectorAll('[contenteditable], img').forEach(function (nested) {
                nested.removeAttribute('contenteditable');
                nested.setAttribute('draggable', 'false');
            });
            canvas.appendChild(clone);
        });

        if (!canvas.children.length && section.hasAttribute('data-background-iframe')) {
            var media = makeElement('div', 'matrix-media-label');
            media.textContent = 'Media\n' + section.getAttribute('data-background-iframe');
            canvas.appendChild(media);
        }

        var badge = makeElement('span', 'matrix-thumbnail-badge');
        badge.textContent = (horizontalIndex + 1) + (verticalIndex ? '.' + verticalIndex : '');
        stage.append(background, canvas, badge);
        thumbnail.appendChild(stage);
        return thumbnail;
    }

    function buildColumn(slide, horizontalIndex) {
        var column = makeElement('div', 'slide-matrix-column');
        var slideId = stableObjectId(slide, 'slide');
        column.dataset.slideId = slideId;

        var header = makeElement('div', 'matrix-column-header');
        header.title = 'Drag left or right to reorder this slide column';
        var title = makeElement('span', 'matrix-column-title');
        title.textContent = plainText(slide.title) || 'Untitled slide';
        header.appendChild(title);

        var pages = makeElement('div', 'slide-matrix-pages');
        pages.dataset.slideId = slideId;
        var sections = getVerticalSections(horizontalIndex);
        var fragmentCounts = {};

        if (Array.isArray(slide.content)) {
            var groups = new Map();
            sections.forEach(function (section, verticalIndex) {
                var contentIndex = sectionContentIndex(section);
                var content = slide.content[contentIndex];
                var contentId = stableObjectId(content, 'content');
                var fragmentOffset = fragmentCounts[contentId] || 0;
                fragmentCounts[contentId] = fragmentOffset + 1;

                if (!groups.has(contentId)) {
                    var group = makeElement('div', 'matrix-page-group');
                    group.dataset.contentId = contentId;
                    groups.set(contentId, group);
                    pages.appendChild(group);
                }
                groups.get(contentId).appendChild(makeThumbnail(
                    slide,
                    section,
                    horizontalIndex,
                    verticalIndex,
                    contentId + '-fragment-' + fragmentOffset
                ));
            });
        }
        else {
            sections.forEach(function (section, verticalIndex) {
                pages.appendChild(makeThumbnail(
                    slide,
                    section,
                    horizontalIndex,
                    verticalIndex,
                    slideId + '-page-' + verticalIndex
                ));
            });
        }

        column.append(header, pages);
        return column;
    }

    function destroySortables() {
        var $columns = $('#slide_matrix_columns');
        if ($columns.data('ui-sortable')) {
            $columns.sortable('destroy');
        }
    }

    function finishPersistence(rollback) {
        $('#slide_matrix').addClass('matrix-saving');
        update_json(false, {
            success: function () {
                $('#slide_matrix').removeClass('matrix-saving');
            },
            error: function () {
                $('#slide_matrix').removeClass('matrix-saving');
                rollback();
                alert('The new slide order could not be saved. The previous order has been restored.');
            }
        });
    }

    function initializeHorizontalSort() {
        var snapshot = null;
        var pendingSlideIds = null;
        $('#slide_matrix_columns').sortable({
            items: '> .slide-matrix-column',
            axis: 'x',
            handle: '.matrix-column-header',
            distance: 5,
            tolerance: 'pointer',
            scroll: true,
            scrollSensitivity: 70,
            scrollSpeed: 20,
            placeholder: 'matrix-column-placeholder',
            forcePlaceholderSize: true,
            start: function () {
                dragging = true;
                snapshot = { slides: slides.slice(), selection: captureSelection() };
                pendingSlideIds = null;
                $('#slide_matrix').addClass('is-dragging');
            },
            update: function () {
                pendingSlideIds = $(this).sortable('toArray', { attribute: 'data-slide-id' });
            },
            stop: function () {
                dragging = false;
                $('#slide_matrix').removeClass('is-dragging');
                if (!snapshot) {
                    return;
                }
                pendingSlideIds = pendingSlideIds || $(this).sortable('toArray', { attribute: 'data-slide-id' });
                var byId = new Map(snapshot.slides.map(function (slide) {
                    return [stableObjectId(slide, 'slide'), slide];
                }));
                var reordered = pendingSlideIds.map(function (slideId) {
                    return byId.get(slideId);
                }).filter(Boolean);

                if (reordered.length !== snapshot.slides.length) {
                    refresh_admin_preview(snapshot.selection);
                    snapshot = null;
                    alert('The column order could not be read. No changes were saved.');
                    return;
                }

                if (reordered.every(function (slide, index) { return slide === snapshot.slides[index]; })) {
                    update_matrix_selection();
                    snapshot = null;
                    return;
                }

                var completedSnapshot = snapshot;
                snapshot = null;
                setTimeout(function () {
                    slides = reordered;
                    refresh_admin_preview(completedSnapshot.selection);
                    finishPersistence(function () {
                        slides = completedSnapshot.slides;
                        refresh_admin_preview(completedSnapshot.selection);
                    });
                }, 0);
            }
        });
    }

    function initializeSortables() {
        initializeHorizontalSort();
    }

    function renderSlideMatrix() {
        var container = document.getElementById('slide_matrix_columns');
        if (!container) {
            return;
        }
        destroySortables();
        container.replaceChildren();
        slides.forEach(function (slide, horizontalIndex) {
            container.appendChild(buildColumn(slide, horizontalIndex));
        });
        initializeSortables();
        update_matrix_selection();
    }

    function update_matrix_selection() {
        var selected = null;
        var focusedThumbnail = document.activeElement && document.activeElement.closest ?
            document.activeElement.closest('.matrix-thumbnail') : null;
        document.querySelectorAll('.matrix-thumbnail').forEach(function (thumbnail) {
            var isSelected = Number(thumbnail.dataset.horizontalIndex) === pos &&
                Number(thumbnail.dataset.verticalIndex) === order;
            thumbnail.classList.toggle('is-selected', isSelected);
            thumbnail.setAttribute('aria-selected', isSelected ? 'true' : 'false');
            if (isSelected) {
                selected = thumbnail;
            }
        });
        if (generalView && selected && !dragging) {
            if (focusedThumbnail && focusedThumbnail !== selected) {
                selected.focus({ preventScroll: true });
            }
            selected.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }

    function update_matrix_background_preview(horizontalIndex, backgroundUrl, brightness) {
        var numericBrightness = Number(brightness);
        if (!Number.isFinite(numericBrightness)) {
            numericBrightness = 1;
        }
        numericBrightness = Math.max(0, Math.min(1, numericBrightness));

        document.querySelectorAll('.matrix-thumbnail').forEach(function (thumbnail) {
            if (Number(thumbnail.dataset.horizontalIndex) !== Number(horizontalIndex)) {
                return;
            }
            var background = thumbnail.querySelector('.matrix-thumbnail-background');
            if (!background) {
                return;
            }
            background.style.backgroundImage = backgroundUrl ?
                'url("' + String(backgroundUrl).replace(/"/g, '\\"') + '")' : 'none';
            background.style.opacity = '1';
            background.style.filter = 'brightness(' + numericBrightness + ')';
        });
    }

    function refresh_admin_preview(selectionDescriptor) {
        if (!slides.length) {
            suppressNextLoadRender = true;
            load_slides();
            if (generalView) {
                renderSlideMatrix();
            }
            return;
        }

        var descriptor = selectionDescriptor || captureSelection();
        suppressNextLoadRender = true;
        load_slides();
        Reveal.sync();
        apply_background_brightness();
        var next = resolveSelection(descriptor);
        pos = next.h;
        order = next.v;
        Reveal.slide(pos, order);
        content_index = typeof get_content_index === 'function' ? get_content_index(pos, order) : 0;
        change_slide();
        if (generalView) {
            renderSlideMatrix();
        }
    }

    function syncSelectionFromReveal() {
        if (typeof Reveal === 'undefined' || typeof Reveal.getIndices !== 'function') {
            return;
        }
        var indices = Reveal.getIndices();
        if (Number.isInteger(indices.h)) {
            pos = indices.h;
        }
        order = Number.isInteger(indices.v) ? indices.v : 0;
    }

    function isEditingElement(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }
        return element.matches('input, textarea, select') ||
            element.isContentEditable ||
            Boolean(element.closest('[contenteditable="true"]'));
    }

    function isVisible(element) {
        if (!element || element.hidden) {
            return false;
        }
        var style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    function hasPriorityEscapeUi() {
        return Array.from(document.querySelectorAll(
            '.ui-dialog, dialog[open], [role="dialog"][aria-modal="true"], ' +
            '#msgbox, #bible_panel'
        )).some(isVisible);
    }

    function handleAdminEscape(event) {
        if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) {
            return;
        }
        if (isEditingElement(event.target) || isEditingElement(document.activeElement)) {
            return;
        }
        if (hasPriorityEscapeUi()) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        toggle_general_view();
    }

    function setGeneralView(nextValue) {
        if (adding_slide === 1) {
            return;
        }
        if (nextValue) {
            syncSelectionFromReveal();
        }
        generalView = nextValue;
        var reveal = document.querySelector('.slide-viewport > .reveal');
        var matrix = document.getElementById('slide_matrix');
        var button = document.getElementById('general_view_btn');
        if (!reveal || !matrix || !button) {
            return;
        }

        reveal.hidden = generalView;
        matrix.hidden = !generalView;
        button.classList.toggle('active', generalView);
        button.setAttribute('aria-pressed', generalView ? 'true' : 'false');
        button.title = generalView ? 'Return to Normal Presentation View' : 'General / Matrix View';

        if (generalView) {
            renderSlideMatrix();
        }
        else {
            Reveal.layout();
            Reveal.slide(pos, order);
        }
    }

    function toggle_general_view() {
        setGeneralView(!generalView);
    }

    function handleMatrixActivation(event) {
        var thumbnail = event.target.closest('.matrix-thumbnail');
        if (!thumbnail || dragging) {
            return;
        }
        if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') {
            return;
        }
        if (event.type === 'keydown') {
            event.preventDefault();
        }
        select_admin_slide(
            Number(thumbnail.dataset.horizontalIndex),
            Number(thumbnail.dataset.verticalIndex)
        );
    }

    document.addEventListener('DOMContentLoaded', function () {
        var columns = document.getElementById('slide_matrix_columns');
        var button = document.getElementById('general_view_btn');
        if (columns) {
            columns.addEventListener('click', handleMatrixActivation);
            columns.addEventListener('keydown', handleMatrixActivation);
            columns.addEventListener('dragstart', function (event) {
                event.preventDefault();
            });
        }
        if (button) {
            button.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggle_general_view();
                }
            });
        }
        document.addEventListener('keydown', handleAdminEscape, true);
    });

    document.addEventListener('presentation:slides-loaded', function () {
        if (suppressNextLoadRender) {
            suppressNextLoadRender = false;
            return;
        }
        if (generalView) {
            renderSlideMatrix();
        }
    });

    window.toggle_general_view = toggle_general_view;
    window.refresh_admin_preview = refresh_admin_preview;
    window.update_matrix_selection = update_matrix_selection;
    window.update_matrix_background_preview = update_matrix_background_preview;
    window.AdminSlideMatrix = {
        isGeneralView: function () { return generalView; },
        render: renderSlideMatrix
    };
}());
