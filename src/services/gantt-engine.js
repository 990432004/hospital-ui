const PHASE_COLORS = {preop:'#6BA3FF', transfer:'#87F7CF', surgery:'#40CDFE', recovery:'#D2F5A6'};
const BAR_TEXT = '#07111F';
const DEVIATION_FILL_ALPHA = 0.22;
/**
 * GanttEngine - 围手术期时序甘特图核心渲染引擎 v2.0
 * 深色主题适配 · 1小时间隔 · 整天视图 · Canvas 2D渲染
 */

// Preserved Canvas renderer from decision-app, scoped to this Vue application.


  const Utils = {
    formatTime(date, includeDate = false) {
      const d = new Date(date);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      if (includeDate) {
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${mo}-${day} ${h}:${m}`;
      }
      return `${h}:${m}`;
    },

    parseLocalTime(input, baseDate) {
      if (input instanceof Date) return input;
      if (!input) return null;
      const str = String(input).trim();
      const timeOnlyMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (timeOnlyMatch) {
        const base = baseDate ? new Date(baseDate) : new Date();
        base.setHours(0, 0, 0, 0);
        base.setHours(parseInt(timeOnlyMatch[1], 10), parseInt(timeOnlyMatch[2], 10), parseInt(timeOnlyMatch[3] || '0', 10), 0);
        return base;
      }
      const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
      if (isoMatch) {
        const d = new Date();
        d.setFullYear(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
        d.setHours(parseInt(isoMatch[4], 10), parseInt(isoMatch[5], 10), parseInt(isoMatch[6], 10), 0);
        return d;
      }
      return new Date(str);
    },

    diffMinutes(a, b) {
      return Math.round((new Date(b) - new Date(a)) / 60000);
    },

    isOverlapping(start1, end1, start2, end2) {
      return new Date(start1) < new Date(end2) && new Date(end2) > new Date(start1) &&
             new Date(start2) < new Date(end1) && new Date(end1) > new Date(start2);
    },

    clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    },

    measureText(ctx, text, font) {
      const prevFont = ctx.font;
      if (font) ctx.font = font;
      const width = ctx.measureText(text).width;
      if (font) ctx.font = prevFont;
      return width;
    },

    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  };

  const CONFIG = {
    HEADER_HEIGHT: 44,
    ROW_HEIGHT: 56,
    SUB_ROW_HEIGHT: 34,
    GROUP_HEADER_HEIGHT: 28,
    TIME_BAR_HEIGHT: 22,
    Y_AXIS_WIDTH: 190,
    MIN_ZOOM: 0.3,
    MAX_ZOOM: 8,
    ZOOM_STEP: 0.15,
    PIXELS_PER_HOUR: 100,
    COLORS: {
      background: '#1f1f1f',
      gridLine: 'rgba(170, 170, 170, 0.06)',
      gridLineMajor: 'rgba(170, 170, 170, 0.12)',
      headerBg: '#1f1f1f',
      headerText: '#aaaaaa',
      rowAlt: '#252525',
      subRowBg: '#303030',
      rowHover: 'rgba(128, 128, 128, 0.4)',
      planBar: 'rgba(170, 170, 170, 0.2)',
      planBarBorder: 'rgba(170, 170, 170, 0.25)',
      barOverlay: null,
      actualBar: '#6BA3FF',
      actualBarBorder: '#6BA3FF',
      deviationEarly: '#10b981',
      deviationLate: '#ef4444',
      conflictWave: '#ef4444',
      selectedBorder: '#f59e0b',
      tooltipBg: '#292929',
      tooltipText: '#eeeeee',
      tooltipBorder: 'rgba(170, 170, 170, 0.15)',
      safetyCheck: '#10b981',
      safetyCheckFail: '#ef4444',
      adverseEvent: '#ef4444',
      textPrimary: '#eeeeee',
      textSecondary: '#aaaaaa',
      yAxisBg: '#1f1f1f',
      currentTimeLine: '#ef4444',
      selectedTimeLine: '#3b82f6',
      admissionMarker: '#10b981',
      transferMarker: '#3b82f6',
      recoveryMarker: '#f97316',
      timelineNode: {
        '术前': '#86efac',
        '入室': '#8b5cf6',
        '麻醉': '#06b6d4',
        '手术': '#3b82f6',
        '清点': '#f59e0b',
        '核查': '#10b981',
        '标本': '#ec4899',
        '交接': '#6366f1',
        '出室': '#ef4444',
        '转运': '#3b82f6',
        '复苏': '#f97316'
      }
    },
    NODE_SHAPES: {
      '术前': 'circle',
      '入室': 'circle',
      '麻醉': 'diamond',
      '手术': 'rect',
      '清点': 'triangle',
      '核查': 'pentagon',
      '标本': 'hexagon',
      '交接': 'star',
      '出室': 'circle',
      '转运': 'arrow',
      '复苏': 'rect'
    },
    FONTS: {
      header: '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      rowLabel: '14px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      rowSubLabel: '12px ui-monospace, SFMono-Regular, Consolas, monospace',
      timeLabel: '12px ui-monospace, SFMono-Regular, Consolas, monospace',
      barText: '12px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      deviation: '500 12px ui-monospace, SFMono-Regular, Consolas, monospace',
      tooltip: '14px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      tooltipTitle: '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
    }
  };

  class GanttEngine {
    constructor(container, options = {}) {
      if (!container) throw new Error('GanttEngine: container is required');
      this.container = container;
      this._listeners = [];
      this._destroyed = false;
      // Deep merge: shallow-merge top-level, then deep-merge COLORS to preserve defaults
      this.options = Object.assign({}, CONFIG, options);
      if (options.COLORS) {
        this.options.COLORS = Object.assign({}, CONFIG.COLORS, options.COLORS);
        if (options.COLORS.timelineNode) {
          this.options.COLORS.timelineNode = Object.assign({}, CONFIG.COLORS.timelineNode, options.COLORS.timelineNode);
        }
      }

      this.canvas = document.createElement('canvas');
      this.canvas.tabIndex = 0;
      this.canvas.setAttribute('role', 'img');
      this.canvas.setAttribute('aria-label', '围手术期时序甘特图。可使用方向键平移，加减键缩放，回车重置；手术详情也可通过上方搜索查看。');
      this.canvas.style.display = 'block';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      this.data = [];
      this.groups = [];
      this.viewMode = 'day';
      this.viewDate = new Date();
      this.viewDate.setHours(0, 0, 0, 0);

      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;

      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.dragStartOffsetX = 0;
      this.dragStartOffsetY = 0;
      this.hoveredSurgery = null;
      this.selectedSurgery = null;
      this.selectedTime = null;
      this.mouseX = 0;
      this.mouseY = 0;

      this.dirtyRect = null;
      this.animationFrameId = null;
      this.lastRenderTime = 0;
      this.eventMarkers = [];
      this.clockTimer = null;
      this.timelineEvents = [];
      this.hoveredTimelineNode = null;
      this.expandedGroup = null;
      this._expandedProgress = 1;
      this._expansionAnimation = null;
      this._pendingExpandedGroup = null;
      this.subTasks = [];
      this._groupRowMap = [];
      this.groupCatalog = [];

      this._bindEvents();
      this._resize();

      this.resizeObserver = new ResizeObserver(() => this._resize());
      this.resizeObserver.observe(this.container);
    }

    setData(surgeries, groupBy = 'room', groupCatalog = []) {
      this._cancelExpansion();
      // 使用视图日期作为基准日期
      const baseDate = this.viewDate;
      const groupChanged = this.groupBy !== groupBy;
      this.groupCatalog = Array.isArray(groupCatalog) ? groupCatalog : [];

      this.data = surgeries.map((s, idx) => ({
        id: s.id || `surgery-${idx}`,
        sourceSurgeryId: s.sourceSurgeryId || s._raw?.id || s.id,
        name: s.name || '未命名手术',
        patient: s.patient || '未知患者',
        doctor: s.doctor || '未知医生',
        nurse: s.nurse || '未知护士',
        room: s.room || '未知手术间',
        equipment: s.equipment || '无设备',
        planStart: Utils.parseLocalTime(s.planStart, baseDate),
        planEnd: Utils.parseLocalTime(s.planEnd, baseDate),
        actualStart: s.actualStart ? Utils.parseLocalTime(s.actualStart, baseDate) : null,
        actualEnd: s.actualEnd ? Utils.parseLocalTime(s.actualEnd, baseDate) : null,
        actualProgressEnd: s.actualProgressEnd ? Utils.parseLocalTime(s.actualProgressEnd, baseDate) : null,
        status: s.status || 'planned',
        color: s.color || '#3b82f6',
        events: s.events || [],
        _rowIndex: 0,
        _conflicts: [],
        _raw: s._raw,
        admissionTime: s.admissionTime || null,
        transferInTime: s.transferInTime || null,
        transferOutTime: s.transferOutTime || null,
        recoveryStartTime: s.recoveryStartTime || null,
        recoveryEndTime: s.recoveryEndTime || null,
        pacuRoomNo: s.pacuRoomNo || null,
        pacuBedNo: s.pacuBedNo || null
      }));

      this._groupData(groupBy);
      if (groupChanged) {
        this.expandedGroup = null;
        this.subTasks = [];
        this._rebuildGroupRowMap();
      }
      this._detectConflicts();
      this._requestRender();
    }

    setEventMarkers(markers) {
      this.eventMarkers = (markers || []).map(m => ({
        id: m.id,
        time: Utils.parseLocalTime(m.time, this.viewDate),
        type: m.type,
        surgeryId: m.surgeryId,
        description: m.description || ''
      }));
      this._requestRender();
    }

    setTimelineEvents(events) {
      this.timelineEvents = (events || []).map(e => ({
        id: e.id,
        surgeryId: e.surgeryId,
        nodeCode: e.nodeCode,
        nodeName: e.nodeName,
        category: e.category,
        plannedTime: Utils.parseLocalTime(e.plannedTime, this.viewDate),
        actualTime: Utils.parseLocalTime(e.actualTime, this.viewDate),
        deviation: e.deviation || 0,
        status: e.status || '正常'
      }));
      if (this.expandedGroup) {
        const group = this.groups.find(g => g.name === this.expandedGroup);
        this.subTasks = group ? this._buildSubTasks(group) : [];
        if (!group) this.expandedGroup = null;
        this._rebuildGroupRowMap();
      }
      this._requestRender();
    }

    _groupData(groupBy) {
      const groupMap = new Map();
      const groupKeyMap = { room: 'room', doctor: 'doctor', nurse: 'nurse', patient: 'patient', equipment: 'equipment', pacu: 'pacuBedNo' };
      const key = groupKeyMap[groupBy] || 'room';
      this.groupBy = groupBy;
      this.groupCatalog.forEach(name => groupMap.set(name, { name, surgeries: [] }));

      this.data.forEach(surgery => {
        const groupValue = surgery[key];
        if (!groupValue) return;
        if (!groupMap.has(groupValue)) {
          groupMap.set(groupValue, { name: groupValue, surgeries: [] });
        }
        groupMap.get(groupValue).surgeries.push(surgery);
      });

      this.groups = Array.from(groupMap.values()).sort((a, b) =>
        String(a.name).localeCompare(String(b.name), 'zh-CN')
      );

      // Compute row mapping considering expanded groups
      this._rebuildGroupRowMap();
    }

    _rebuildGroupRowMap() {
      let rowIdx = 0;
      this._groupRowMap = [];

      this.groups.forEach((group, groupIndex) => {
        group.stripeIndex = groupIndex;
        const isExpanded = this.expandedGroup === group.name;
        const subTaskCount = isExpanded ? this._getSubTaskCountForGroup(group) : 0;
        const totalRows = 1 + subTaskCount;

        group.rowIndex = rowIdx;
        group.totalRows = totalRows;
        group.subTaskCount = subTaskCount;

        this._groupRowMap.push({
          groupName: group.name,
          startRow: rowIdx,
          totalRows: totalRows,
          isExpanded: isExpanded,
          mainHeight: this.groupBy === 'patient' ? 60 + Math.max(0, group.surgeries.length - 1) * 28 : this.options.ROW_HEIGHT
        });

        group.surgeries.forEach(s => { s._rowIndex = rowIdx; });

        rowIdx += totalRows;
      });
    }

    _getSubTaskCountForGroup(group) {
      if (!this.subTasks.length) return 0;
      return this.subTasks.filter(st => st.parentGroupName === group.name).length;
    }

    _getTotalRows() {
      return this._groupRowMap.reduce((sum, m) => sum + m.totalRows, 0);
    }

    _detectConflicts() {
      this.data.forEach(s => { s._conflicts = []; });
      this.groups.forEach(group => {
        const surgeries = group.surgeries;
        for (let i = 0; i < surgeries.length; i++) {
          for (let j = i + 1; j < surgeries.length; j++) {
            const a = surgeries[i], b = surgeries[j];
            const aStart = a.actualStart || a.planStart;
            const aEnd = a.actualEnd || a.planEnd;
            const bStart = b.actualStart || b.planStart;
            const bEnd = b.actualEnd || b.planEnd;
            if (Utils.isOverlapping(aStart, aEnd, bStart, bEnd)) {
              a._conflicts.push(b.id);
              b._conflicts.push(a.id);
            }
          }
        }
      });
    }

    _timeToX(time) {
      const t = new Date(time).getTime();
      const viewStart = this._getViewStart().getTime();
      const pixelsPerMs = (this.options.PIXELS_PER_HOUR * this.scale) / 3600000;
      return this.options.Y_AXIS_WIDTH + this.offsetX + (t - viewStart) * pixelsPerMs;
    }

    _xToTime(x) {
      const viewStart = this._getViewStart().getTime();
      const pixelsPerMs = (this.options.PIXELS_PER_HOUR * this.scale) / 3600000;
      const relX = x - this.options.Y_AXIS_WIDTH - this.offsetX;
      return new Date(viewStart + relX / pixelsPerMs);
    }

    // Derive every tick from a real clock value, rather than labelling 07:30 as 07:00.
    _getTimeTicks(intervalMinutes, width) {
      const first = this._xToTime(this.options.Y_AXIS_WIDTH);
      const minutes = first.getHours() * 60 + first.getMinutes() + first.getSeconds() / 60 + first.getMilliseconds() / 60000;
      first.setHours(0, Math.ceil(minutes / intervalMinutes) * intervalMinutes, 0, 0);
      const ticks = [];
      for (let stamp = first.getTime(); stamp <= this._getViewEnd().getTime() && this._timeToX(stamp) < width; stamp += intervalMinutes * 60000) {
        ticks.push({time:new Date(stamp), x:this._timeToX(stamp)});
      }
      return ticks;
    }

    _rowToY(rowIndex) {
      // Walk through groupRowMap to compute Y for a given row index
      let y = this.options.HEADER_HEIGHT + this.offsetY;
      for (const map of this._groupRowMap) {
        if (rowIndex < map.startRow) continue;
        if (rowIndex >= map.startRow + map.totalRows) {
          // This group is entirely before the requested row
          y += this._getGroupHeight(map);
          continue;
        }
        // Row is within this group
        const localRow = rowIndex - map.startRow;
        if (localRow === 0) {
          // Main row
          return y;
        } else {
          // Sub-task row
          return y + map.mainHeight + (localRow - 1) * this.options.SUB_ROW_HEIGHT;
        }
      }
      // Fallback for rows beyond the map
      return y + rowIndex * this.options.ROW_HEIGHT;
    }

    _yToRow(y) {
      // Walk through groupRowMap to find which row the Y coordinate falls in
      let currentY = this.options.HEADER_HEIGHT + this.offsetY;
      for (const map of this._groupRowMap) {
        const groupHeight = this._getGroupHeight(map);
        if (y < currentY) {
          // Before this group, find the group before
          break;
        }
        if (y < currentY + groupHeight) {
          // Within this group
          const relY = y - currentY;
          if (relY < map.mainHeight) {
            return map.startRow; // Main row
          }
          const subRowFloat = (relY - map.mainHeight) / this.options.SUB_ROW_HEIGHT;
          const subRow = Math.floor(subRowFloat);
          return map.startRow + 1 + Math.min(subRow, map.totalRows - 2);
        }
        currentY += groupHeight;
      }
      // Fallback
      return Math.floor((y - this.options.HEADER_HEIGHT - this.offsetY) / this.options.ROW_HEIGHT);
    }

    _getGroupHeight(map) {
      return map.mainHeight + (map.totalRows - 1) * this.options.SUB_ROW_HEIGHT * (map.isExpanded ? this._expandedProgress : 1);
    }

    _cancelExpansion() {
      this._expansionAnimation = null;
      this._pendingExpandedGroup = null;
      this._expandedProgress = 1;
    }

    _toggleGroup(group) {
      this.hoveredSurgery = this.hoveredTimelineNode = this.hoveredPhaseSubTask = null;
      if (this.expandedGroup === group.name) {
        this._pendingExpandedGroup = null;
        this._animateExpansion(this._expansionAnimation?.to === 0 ? 1 : 0);
      } else if (this.expandedGroup) {
        this._pendingExpandedGroup = group.name;
        this._animateExpansion(0);
      } else {
        this._openGroup(group);
      }
    }

    _openGroup(group) {
      this.expandedGroup = group.name;
      this.subTasks = this._buildSubTasks(group);
      this._expandedProgress = 0;
      this._rebuildGroupRowMap();
      this._animateExpansion(1);
    }

    _animateExpansion(to) {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      this._expansionAnimation = {
        from: this._expandedProgress, to, start: performance.now(),
        duration: reduced ? 0 : 220 * Math.abs(to - this._expandedProgress)
      };
      this._emit('toggleExpand', {groupName:this.expandedGroup, expanded:to === 1});
      if (!this._expansionAnimation.duration) this._advanceExpansion(performance.now());
      this._requestRender();
    }

    _advanceExpansion(now) {
      const animation = this._expansionAnimation;
      if (!animation) return;
      const t = animation.duration ? Utils.clamp((now - animation.start) / animation.duration, 0, 1) : 1;
      const eased = 1 - Math.pow(1 - t, 3);
      this._expandedProgress = animation.from + (animation.to - animation.from) * eased;
      if (t < 1) return;
      this._expansionAnimation = null;
      if (animation.to === 0) {
        this.expandedGroup = null;
        this.subTasks = [];
        this._rebuildGroupRowMap();
        const next = this.groups.find(group => group.name === this._pendingExpandedGroup);
        this._pendingExpandedGroup = null;
        if (next) this._openGroup(next);
      }
    }

    _visibleRowHeight(row) {
      if (!this._isSubRow(row)) return this._mainRowHeight(row);
      const map = this._groupRowMap.find(map => row > map.startRow && row < map.startRow + map.totalRows);
      const bottom = this._rowToY(map.startRow) + this._getGroupHeight(map);
      return Utils.clamp(bottom - this._rowToY(row), 0, this.options.SUB_ROW_HEIGHT);
    }

    _rowBackground(row) {
      if (this._isSubRow(row)) return this.options.COLORS.subRowBg;
      return this._getGroupAtRow(row)?.stripeIndex % 2 ? this.options.COLORS.rowAlt : this.options.COLORS.background;
    }

    _renderRowBackgrounds(ctx, x, width, height) {
      ctx.save();ctx.beginPath();ctx.rect(x, this.options.HEADER_HEIGHT, width, height - this.options.HEADER_HEIGHT);ctx.clip();
      const first = Math.max(0, this._yToRow(this.options.HEADER_HEIGHT));
      const last = Math.min(this._getTotalRows() - 1, this._yToRow(height));
      for (let row = first; row <= last; row++) {
        const y = this._rowToY(row), rowH = this._visibleRowHeight(row);
        if (!rowH) continue;
        ctx.fillStyle = this._rowBackground(row);
        ctx.fillRect(x, y, width, rowH);
      }
      ctx.restore();
    }

    _drawGroupToggle(ctx, y, group) {
      const progress = this.expandedGroup === group.name ? this._expandedProgress : 0;
      ctx.save();ctx.translate(10, y);ctx.rotate(progress * Math.PI / 2);
      ctx.beginPath();ctx.moveTo(-3, -4);ctx.lineTo(3, 0);ctx.lineTo(-3, 4);ctx.closePath();ctx.fill();ctx.restore();
    }

    _mainRowHeight(row) {
      return this._groupRowMap.find(map => map.startRow === row)?.mainHeight || this.options.ROW_HEIGHT;
    }

    _patientBarY(surgery) {
      const group = this._getGroupAtRow(surgery._rowIndex);
      const lane = Math.max(0, group?.surgeries.indexOf(surgery) ?? 0);
      const barsHeight = Math.max(1, group?.surgeries.length || 0) * 28;
      const inset = (this._mainRowHeight(surgery._rowIndex) - barsHeight) / 2;
      return this._rowToY(surgery._rowIndex) + inset + lane * 28;
    }

    _getScrollBounds(width, height) {
      const opt = this.options;
      const viewportWidth = Math.max(0, width - opt.Y_AXIS_WIDTH);
      const viewportHeight = Math.max(0, height - opt.HEADER_HEIGHT);
      const durationHours = Math.max(0, this._getViewEnd() - this._getViewStart()) / 3600000;
      const contentWidth = durationHours * opt.PIXELS_PER_HOUR * this.scale;
      const contentHeight = this._groupRowMap.reduce((sum, map) => sum + this._getGroupHeight(map), 0);

      return {
        minX: Math.min(0, viewportWidth - contentWidth),
        maxX: 0,
        minY: Math.min(0, viewportHeight - contentHeight),
        maxY: 0
      };
    }

    _clampOffsets(width, height) {
      const bounds = this._getScrollBounds(width, height);
      this.offsetX = Utils.clamp(this.offsetX, bounds.minX, bounds.maxX);
      this.offsetY = Utils.clamp(this.offsetY, bounds.minY, bounds.maxY);
      return bounds;
    }

    _getGroupAtRow(rowIndex) {
      for (const map of this._groupRowMap) {
        if (rowIndex >= map.startRow && rowIndex < map.startRow + map.totalRows) {
          return this.groups.find(g => g.name === map.groupName);
        }
      }
      return null;
    }

    _isSubRow(rowIndex) {
      for (const map of this._groupRowMap) {
        if (rowIndex > map.startRow && rowIndex < map.startRow + map.totalRows) {
          return true;
        }
      }
      return false;
    }

    _getSubTaskAtRow(rowIndex) {
      if (!this.expandedGroup || !this.subTasks.length) return null;
      for (const map of this._groupRowMap) {
        if (rowIndex > map.startRow && rowIndex < map.startRow + map.totalRows) {
          const localIdx = rowIndex - map.startRow - 1;
          const groupSubTasks = this.subTasks.filter(st => st.parentGroupName === map.groupName);
          return groupSubTasks[localIdx] || null;
        }
      }
      return null;
    }

    _getViewStart() {
      const d = new Date(this.viewDate);
      d.setHours(7, 30, 0, 0);
      return d;
    }

    _getViewEnd() {
      const d = this._getViewStart();
      d.setHours(22, 0, 0, 0);
      return d;
    }

    _requestRender() {
      if (this._destroyed || this.animationFrameId) return;
      this.animationFrameId = requestAnimationFrame(() => {
        this.animationFrameId = null;
        this._advanceExpansion(performance.now());
        this.render();
        if (this._expansionAnimation) this._requestRender();
      });
    }

    render() {
      const ctx = this.ctx;
      const width = this.canvas.width / (window.devicePixelRatio || 1);
      const height = this.canvas.height / (window.devicePixelRatio || 1);
      const opt = this.options;
      this._clampOffsets(width, height);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = opt.COLORS.background;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.beginPath();
      ctx.rect(opt.Y_AXIS_WIDTH, 0, width - opt.Y_AXIS_WIDTH, height);
      ctx.clip();

      this._renderTimeGrid(ctx, width, height);
      this._renderCurrentTimeLine(ctx, width, height);
      this._renderSelectedTimeLine(ctx, width, height);
      this._renderSurgeryBars(ctx, width, height);
      this._renderEventMarkers(ctx, width, height);

      ctx.restore();
      this._renderYAxis(ctx, width, height);
      this._renderTimeHeader(ctx, width);

      if (this.selectedSurgery) {
        this._renderSelection(ctx);
      }
      this._renderLegend(ctx, width, height);
      if (this.hoveredTimelineNode) {
        this._renderNodeTooltip(ctx);
      } else if (this.hoveredPhaseSubTask) {
        this._renderPhaseTooltip(ctx);
      } else if (this.hoveredSurgery) {
        this._renderTooltip(ctx);
      }

      this.lastRenderTime = performance.now();
    }

    _phaseNodeMarkers(nodes, y, left, right) {
      const markers = [];
      for (const node of [...nodes].filter(n => n.actualTime).sort((a,b) => a.actualTime-b.actualTime)) {
        const x = this._timeToX(node.actualTime);
        if (x < left || x > right) continue;
        const previous = markers.at(-1);
        if (previous && x - previous.x < 18) previous.nodes.push(node);
        else markers.push({x, y, nodes:[node]});
      }
      return markers;
    }

    _barTextShadow(ctx) {
      ctx.shadowColor = 'rgba(255,255,255,0.85)';
      ctx.shadowBlur = 2;ctx.shadowOffsetX = 0;ctx.shadowOffsetY = 1;
    }

    _hoverBar(ctx, x, y, width, height) {
      if (!(this.hoveredSurgery || this.hoveredPhaseSubTask || this.hoveredTimelineNode)) return;
      if (this.mouseX < x || this.mouseX > x + width || this.mouseY < y || this.mouseY > y + height) return;
      ctx.save();ctx.fillStyle = 'rgba(255,255,255,0.24)';ctx.fill();ctx.restore();
    }

    _barLabel(ctx, text, x, y, width, align = 'left') {
      ctx.save();
      ctx.fillStyle = BAR_TEXT;
      ctx.font = this.options.FONTS.barText;
      this._barTextShadow(ctx);
      const available = Math.max(0, width - 16);
      let label = text;
      if (ctx.measureText(label).width > available) {
        while (label.length && ctx.measureText(label + '…').width > available) label = label.slice(0, -1);
        label = label ? label + '…' : '';
      }
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.fillText(label, align === 'center' ? x + width / 2 : x + 8, y);
      ctx.restore();
    }

    _shadeBar(ctx) {
      if (!this.options.COLORS.barOverlay) return;
      ctx.save();
      ctx.fillStyle = this.options.COLORS.barOverlay;
      ctx.fill();
      ctx.restore();
    }

    _renderLegend(ctx, width, height) {
      const colors = this.options.COLORS;
      const items = this.groupBy === 'patient'
        ? [{label:'术前准备',color:PHASE_COLORS.preop},{label:'转运',color:PHASE_COLORS.transfer},{label:'术中',color:PHASE_COLORS.surgery},{label:'术后复苏',color:PHASE_COLORS.recovery}]
        : [{label:'计划',plan:true},{label:'实际',color:colors.actualBar},{label:'提前',color:colors.deviationEarly,deviation:true},{label:'延时',color:colors.deviationLate,deviation:true}];
      ctx.save();
      ctx.font = this.options.FONTS.header;
      const available = Math.max(120, width - 32), positions = [];
      let x = 14, row = 0, maxX = 0;
      for (const item of items) {
        const itemWidth = 20 + ctx.measureText(item.label).width + 20;
        if (x + itemWidth > available && x > 14) {row++; x = 14;}
        positions.push({...item, x, row}); x += itemWidth; maxX = Math.max(maxX, x);
      }
      const boxH = (row + 1) * 24 + 16, y = height - boxH - 14;
      ctx.fillStyle = colors.tooltipBg;
      ctx.strokeStyle = colors.tooltipBorder; ctx.lineWidth = 1;
      this._roundRect(ctx, 12, y, Math.min(available, maxX), boxH, 6);
      ctx.fill();ctx.stroke();
      for (const item of positions) {
        const left = item.x + 12, top = y + 8 + item.row * 24;
        ctx.fillStyle = item.plan ? colors.planBar : item.deviation ? Utils.hexToRgba(item.color, DEVIATION_FILL_ALPHA) : item.color;
        this._roundRect(ctx, left, top + 7, 10, 10, 2);
        ctx.fill();
        if (!item.deviation) this._shadeBar(ctx);
        if (item.plan) {ctx.setLineDash([2,2]);ctx.strokeStyle = colors.planBarBorder;ctx.stroke();ctx.setLineDash([]);}
        ctx.fillStyle = colors.textPrimary;ctx.textAlign = 'left';ctx.textBaseline = 'middle';
        ctx.fillText(item.label, left + 18, top + 12);
      }
      const oldRight = 12 + Math.min(available, maxX);
      this._renderNodeLegend(ctx, width, height, oldRight, y);
      ctx.restore();
    }

    _renderNodeLegend(ctx, width, height, oldRight, oldTop) {
      const opt = this.options, colors = opt.COLORS;
      // Keep the two legends distinct; wrap node entries within the right-hand panel.
      const beside = width - oldRight - 26 >= 220;
      const left = beside ? oldRight + 12 : 12;
      const available = Math.max(120, width - left - 14);
      const items = [...Object.keys(opt.NODE_SHAPES).map(category => ({label:category, category})), {label:'聚合节点', grouped:true}];
      const positions = [];
      let x = 14, row = 0, maxX = 0;
      for (const item of items) {
        const itemWidth = 20 + ctx.measureText(item.label).width + 16;
        if (x + itemWidth + 10 > available && x > 14) {row++;x = 14;}
        positions.push({...item,x,row});x += itemWidth;maxX = Math.max(maxX,x);
      }
      const boxH = (row + 1) * 24 + 16;
      const top = beside ? height - boxH - 14 : oldTop - boxH - 10;
      ctx.fillStyle = colors.tooltipBg;ctx.strokeStyle = colors.tooltipBorder;ctx.lineWidth = 1;
      this._roundRect(ctx,left,top,Math.min(available,maxX+6),boxH,6);ctx.fill();ctx.stroke();
      for (const item of positions) {
        const cx = left + item.x + 5, cy = top + 20 + item.row * 24;
        ctx.fillStyle = item.grouped ? colors.tooltipBg : colors.timelineNode[item.category];
        ctx.strokeStyle = item.grouped ? colors.textPrimary : '#ffffff';ctx.lineWidth = 1.5;
        this._drawNodeShape(ctx,item.grouped ? 'circle' : opt.NODE_SHAPES[item.category],cx,cy,item.grouped ? 8 : 4);
        ctx.fill();ctx.stroke();
        ctx.fillStyle = colors.textPrimary;ctx.textBaseline = 'middle';
        if (item.grouped) {ctx.textAlign = 'center';ctx.fillText('2',cx,cy);}
        ctx.textAlign = 'left';ctx.fillText(item.label,cx+14,cy);
      }
    }

    _renderTimeGrid(ctx, width, height) {
      const opt = this.options;
      const pixelsPerHour = opt.PIXELS_PER_HOUR * this.scale;

      let minorInterval, majorInterval;
      if (pixelsPerHour >= 150) {
        minorInterval = 15;
        majorInterval = 60;
      } else if (pixelsPerHour >= 60) {
        minorInterval = 30;
        majorInterval = 60;
      } else {
        minorInterval = 60;
        majorInterval = 120;
      }


      this._renderRowBackgrounds(ctx, opt.Y_AXIS_WIDTH, width - opt.Y_AXIS_WIDTH, height);

      // 次要网格线
      ctx.strokeStyle = opt.COLORS.gridLine;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (const {x} of this._getTimeTicks(minorInterval, width)) {
        if (x < opt.Y_AXIS_WIDTH) continue;
        ctx.moveTo(x, opt.HEADER_HEIGHT);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      // 主要网格线（小时线）
      ctx.strokeStyle = opt.COLORS.gridLineMajor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const {x} of this._getTimeTicks(majorInterval, width)) {
        if (x < opt.Y_AXIS_WIDTH) continue;
        ctx.moveTo(x, opt.HEADER_HEIGHT);
        ctx.lineTo(x, height);
      }
      ctx.stroke();


    }

    _renderCurrentTimeLine(ctx, width, height) {
      const now = this.options.now ? new Date(this.options.now()) : new Date();
      const viewStart = this._getViewStart();
      const viewEnd = this._getViewEnd();
      if (now < viewStart || now > viewEnd) return;

      const x = this._timeToX(now);
      if (x < this.options.Y_AXIS_WIDTH || x > width) return;

      ctx.save();
      ctx.strokeStyle = this.options.COLORS.currentTimeLine;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x, this.options.HEADER_HEIGHT);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // 当前时间标签
      ctx.fillStyle = this.options.COLORS.currentTimeLine;
      ctx.font = this.options.FONTS.timeLabel;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const timeLabel = Utils.formatTime(now);
      const labelY = this.options.HEADER_HEIGHT - 4;
      ctx.fillText(timeLabel, x, labelY);
      ctx.restore();
    }

    _renderSelectedTimeLine(ctx, width, height) {
      if (!this.selectedTime) return;

      const viewStart = this._getViewStart();
      const viewEnd = this._getViewEnd();
      if (this.selectedTime < viewStart || this.selectedTime > viewEnd) return;

      const x = this._timeToX(this.selectedTime);
      if (x < this.options.Y_AXIS_WIDTH || x > width) return;

      ctx.save();
      ctx.strokeStyle = this.options.COLORS.selectedTimeLine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, this.options.HEADER_HEIGHT);
      ctx.lineTo(x, height);
      ctx.stroke();

      // 选择时间标签
      ctx.fillStyle = this.options.COLORS.selectedTimeLine;
      ctx.font = this.options.FONTS.timeLabel;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const timeLabel = Utils.formatTime(this.selectedTime);
      const labelY = this.options.HEADER_HEIGHT - 4;
      ctx.fillText(timeLabel, x, labelY);

      // 三角形箭头标记
      const arrowSize = 5;
      ctx.beginPath();
      ctx.moveTo(x, this.options.HEADER_HEIGHT);
      ctx.lineTo(x - arrowSize, this.options.HEADER_HEIGHT - arrowSize);
      ctx.lineTo(x + arrowSize, this.options.HEADER_HEIGHT - arrowSize);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    _renderTimeHeader(ctx, width) {
      const opt = this.options;
      const pixelsPerHour = opt.PIXELS_PER_HOUR * this.scale;

      // 头部背景
      ctx.fillStyle = opt.COLORS.headerBg;
      ctx.fillRect(0, 0, width, opt.HEADER_HEIGHT);

      // 左上角
      ctx.fillStyle = opt.COLORS.yAxisBg;
      ctx.fillRect(0, 0, opt.Y_AXIS_WIDTH, opt.HEADER_HEIGHT);

      // 分隔线
      ctx.strokeStyle = opt.COLORS.gridLineMajor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, opt.HEADER_HEIGHT - 0.5);
      ctx.lineTo(width, opt.HEADER_HEIGHT - 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(opt.Y_AXIS_WIDTH - 0.5, 0);
      ctx.lineTo(opt.Y_AXIS_WIDTH - 0.5, opt.HEADER_HEIGHT);
      ctx.stroke();

      // Clock-aligned labels use exactly the same values as the major grid lines.
      const labelInterval = pixelsPerHour < 60 ? 120 : 60;

      ctx.fillStyle = opt.COLORS.headerText;
      ctx.font = opt.FONTS.timeLabel;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const {time, x} of this._getTimeTicks(labelInterval, width)) {
        const label = Utils.formatTime(time);
        ctx.fillText(label, x, opt.HEADER_HEIGHT / 2 + 2);

        ctx.strokeStyle = opt.COLORS.gridLineMajor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, opt.HEADER_HEIGHT - 5);
        ctx.lineTo(x, opt.HEADER_HEIGHT);
        ctx.stroke();
      }

      // 日期显示
      ctx.fillStyle = opt.COLORS.textPrimary;
      ctx.font = opt.FONTS.header;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const dateStr = `${this.viewDate.getFullYear()}年${this.viewDate.getMonth() + 1}月${this.viewDate.getDate()}日`;
      ctx.fillText(dateStr, 12, opt.HEADER_HEIGHT / 2);
    }

    _renderYAxis(ctx, width, height) {
      const opt = this.options;
      const totalRows = this._getTotalRows();
      const firstRow = Math.max(0, this._yToRow(opt.HEADER_HEIGHT));
      const lastRow = Math.min(totalRows - 1, this._yToRow(height));

      ctx.fillStyle = opt.COLORS.yAxisBg;
      ctx.fillRect(0, opt.HEADER_HEIGHT, opt.Y_AXIS_WIDTH, height - opt.HEADER_HEIGHT);
      this._renderRowBackgrounds(ctx, 0, opt.Y_AXIS_WIDTH, height);

      ctx.strokeStyle = opt.COLORS.gridLineMajor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(opt.Y_AXIS_WIDTH - 0.5, opt.HEADER_HEIGHT);
      ctx.lineTo(opt.Y_AXIS_WIDTH - 0.5, height);
      ctx.stroke();

      for (let row = firstRow; row <= lastRow; row++) {
        const group = this._getGroupAtRow(row);
        if (!group) continue;

        const isSub = this._isSubRow(row);
        const y = this._rowToY(row);
        const rowH = isSub ? opt.SUB_ROW_HEIGHT : this._mainRowHeight(row);
        const centerY = y + rowH / 2;
        const visibleHeight = this._visibleRowHeight(row);
        if (!visibleHeight) continue;
        ctx.save();ctx.beginPath();
        ctx.rect(0, Math.max(opt.HEADER_HEIGHT, y), opt.Y_AXIS_WIDTH, Math.max(0, y + visibleHeight - Math.max(opt.HEADER_HEIGHT, y)));
        ctx.clip();
        if (isSub) ctx.globalAlpha = 0.4 + 0.6 * this._expandedProgress;

        if (!isSub && this.groupBy === 'patient') {
          ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=opt.COLORS.textSecondary;
          ctx.font=opt.FONTS.header;
          this._drawGroupToggle(ctx, y + 16, group);
          ctx.fillStyle=opt.COLORS.textPrimary;ctx.font=opt.FONTS.rowLabel;
          ctx.fillText(group.name,20,y+16);
          ctx.fillStyle=opt.COLORS.textSecondary;ctx.font=opt.FONTS.rowSubLabel;
          ctx.textAlign='right';ctx.fillText(`${group.surgeries.length}台`,opt.Y_AXIS_WIDTH-12,y+16);
          ctx.textAlign='left';ctx.font=opt.FONTS.header;
          group.surgeries.forEach((surgery,index)=>{
            let label=surgery.name;
            const maxWidth=opt.Y_AXIS_WIDTH-32;
            if(ctx.measureText(label).width>maxWidth){
              while(label.length&&ctx.measureText(label+'…').width>maxWidth)label=label.slice(0,-1);
              label+='…';
            }
            ctx.fillText(label,20,y+40+index*28);
          });
        } else if (!isSub) {
          // Main group row
          const isPacuGroup = this.groupBy === 'pacu';
          const isExpanded = this.expandedGroup === group.name;

          // PACU床位是一级资源行；其他视图可展开查看手术节点。
          ctx.fillStyle = opt.COLORS.textSecondary;
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          if (isPacuGroup) ctx.fillText('\u25CF', 6, centerY - 6);
          else this._drawGroupToggle(ctx, centerY - 6, group);

          // Group name
          ctx.fillStyle = opt.COLORS.textPrimary;
          ctx.font = opt.FONTS.rowLabel;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          let groupLabel = String(group.name);
          const maxGroupLabelWidth = opt.Y_AXIS_WIDTH - 30;
          while (groupLabel.length > 0 && Utils.measureText(ctx, groupLabel + '…', ctx.font) > maxGroupLabelWidth) {
            groupLabel = groupLabel.slice(0, -1);
          }
          ctx.fillText(groupLabel === String(group.name) ? groupLabel : groupLabel + '…', 20, centerY - 6);

          // Surgery count
          ctx.fillStyle = opt.COLORS.textSecondary;
          ctx.font = opt.FONTS.rowSubLabel;
          const countLabel = isPacuGroup
            ? `${group.surgeries.length}位患者`
            : (this.groupBy === 'equipment' ? `${group.surgeries.length}项排程` : `${group.surgeries.length}台`);
          ctx.fillText(countLabel, 20, centerY + 10);

        } else {
          // Sub-task row
          const subTask = this._getSubTaskAtRow(row);
          if (subTask) {
            // Sub-task name only (no category icon, no nodeCode)
            ctx.fillStyle = opt.COLORS.textSecondary;
            ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            const maxTextW = opt.Y_AXIS_WIDTH - 30;
            let nodeName = subTask.nodeName;
            const textW = Utils.measureText(ctx, nodeName, ctx.font);
            if (textW > maxTextW) {
              while (nodeName.length > 0 && Utils.measureText(ctx, nodeName + '..', ctx.font) > maxTextW) {
                nodeName = nodeName.slice(0, -1);
              }
              nodeName += '..';
            }
            ctx.fillText(nodeName, 20, centerY);
          }
        }

        // Row separator line
        ctx.strokeStyle = opt.COLORS.gridLine;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y + rowH - 0.5);
        ctx.lineTo(opt.Y_AXIS_WIDTH, y + rowH - 0.5);
        ctx.stroke();
        ctx.restore();
      }
    }

    _renderSurgeryBars(ctx, width, height) {
      const opt = this.options;
      const totalRows = this._getTotalRows();
      const firstVisibleRow = Math.max(0, this._yToRow(opt.HEADER_HEIGHT));
      const lastVisibleRow = Math.min(totalRows - 1, this._yToRow(height));
      const isPatientView = this.groupBy === 'patient';

      this.data.forEach(surgery => {
        const row = surgery._rowIndex;
        if (row < firstVisibleRow || row > lastVisibleRow) return;

        const y = this._rowToY(row);

        // 患者视图：只渲染4大阶段旅程，不渲染计划/实际手术条
        if (isPatientView && surgery._raw) {
          this._renderPatientJourney(ctx, surgery, y, width);
          return;
        }

        // Every endpoint is generated from its timestamp using the shared axis transform.
        const {plan, actual} = this._getResourceBars(surgery);
        const visible = bar => bar && bar.x + bar.w >= opt.Y_AXIS_WIDTH && bar.x <= width;
        if (!visible(plan) && !visible(actual)) return;
        const barSpacing = 3;
        const barY = y + (opt.ROW_HEIGHT - opt.TIME_BAR_HEIGHT * 2 - barSpacing) / 2;
        const planX = plan?.x, planW = plan?.w;

        // Paint compensation beneath both bars so their colors and labels stay readable.
        if (plan && actual) this._renderDeviation(ctx, surgery, plan.x, plan.w, actual.x, actual.w, barY);
        if (visible(plan)) this._renderPlanBar(ctx, plan.x, barY, plan.w, opt.TIME_BAR_HEIGHT, surgery);
        if (visible(actual)) this._renderActualBar(ctx, actual.x, barY + opt.TIME_BAR_HEIGHT + barSpacing, actual.w, opt.TIME_BAR_HEIGHT, surgery);

        // 冲突波浪
        if (plan && surgery._conflicts.length > 0) {
          this._renderConflictWave(ctx, planX, y + opt.ROW_HEIGHT - 6, planW, 4);
        }

        // 时序节点标记（仅选中手术显示）
        if (this.selectedSurgery && this.selectedSurgery.id === surgery.id) {
          this._renderTimelineNodes(ctx, surgery, row, y, width);
        }
      });

      // Render sub-task bars for expanded group
      if (this.expandedGroup && this.subTasks.length > 0) {
        this._renderSubTaskBars(ctx, width, height, firstVisibleRow, lastVisibleRow);
      }



    }

    _renderSubTaskBars(ctx, width, height, firstVisibleRow, lastVisibleRow) {
      const opt = this.options;

      const map = this._groupRowMap.find(map => map.isExpanded);
      if (!map) return;
      const top = this._rowToY(map.startRow) + map.mainHeight;
      ctx.save();ctx.beginPath();
      ctx.rect(opt.Y_AXIS_WIDTH, Math.max(top, opt.HEADER_HEIGHT), width - opt.Y_AXIS_WIDTH,
        Math.max(0, top + this._getGroupHeight(map) - map.mainHeight - Math.max(top, opt.HEADER_HEIGHT)));
      ctx.clip();ctx.globalAlpha = 0.4 + 0.6 * this._expandedProgress;
      this.subTasks.forEach((subTask, idx) => {
        // Find the row for this subtask
        const row = this._getSubTaskRowIndex(subTask);
        if (row === -1 || row < firstVisibleRow || row > lastVisibleRow) return;

        const y = this._rowToY(row);
        const subBarH = 24;
        const barY = y + (opt.SUB_ROW_HEIGHT - subBarH) / 2;

        if (subTask.actualStart && subTask.actualEnd && subTask.actualEnd > subTask.actualStart) {
          const actualX = this._timeToX(subTask.actualStart);
          const actualW = Math.max(2, this._timeToX(subTask.actualEnd) - actualX);
          if (actualX + actualW >= opt.Y_AXIS_WIDTH && actualX <= width) {
            ctx.save();
            const drawX = Math.max(actualX, opt.Y_AXIS_WIDTH);
            const drawW = Math.min(actualW - (drawX - actualX), actualW);
            if (drawW > 0) {
              const color = opt.COLORS.actualBar;
              ctx.fillStyle = this.groupBy === 'patient' ? subTask.color : color;
              ctx.strokeStyle = Utils.hexToRgba(this.groupBy === 'patient' ? subTask.color : color, 0.4);
              ctx.lineWidth = 1;


              ctx.beginPath();ctx.rect(drawX, barY, drawW, subBarH);
              ctx.fill();
              this._shadeBar(ctx);
              this._hoverBar(ctx, drawX, barY, drawW, subBarH);
              ctx.stroke();

              // 患者视图大阶段：在bar上绘制里程碑标记
              if (subTask.isPhaseSubTask && subTask.milestones && subTask.milestones.length > 0) {
                this._renderPhaseMilestones(ctx, subTask, drawX, barY, drawW, subBarH, width);
              }

              if (drawW > 50 && this.groupBy !== 'patient') {
                const timeText = Utils.formatTime(subTask.actualStart) + '–' + Utils.formatTime(subTask.actualEnd);
                this._barLabel(ctx, subTask.isPhaseSubTask ? subTask.nodeName + '  ' + timeText : timeText,
                  drawX, barY + (subTask.isPhaseSubTask ? 8 : subBarH / 2), Math.min(drawW, width - drawX));
              }
            }
            ctx.restore();
          }
        }
      });
      ctx.restore();
    }

    _renderPhaseMilestones(ctx, subTask, barX, barY, barW, barH, width) {
      const opt = this.options;
      if (!subTask.milestones || subTask.milestones.length === 0) return;

      subTask._nodeMarkers = this._phaseNodeMarkers(subTask.milestones, barY + barH / 2,
        Math.max(barX, opt.Y_AXIS_WIDTH), Math.min(barX + barW, width));
      this._renderNodeMarkers(ctx, subTask._nodeMarkers);
    }

    _getSubTaskRowIndex(subTask) {
      for (const map of this._groupRowMap) {
        if (map.groupName === subTask.parentGroupName && map.isExpanded) {
          const groupSubTasks = this.subTasks.filter(st => st.parentGroupName === map.groupName);
          const localIdx = groupSubTasks.indexOf(subTask);
          if (localIdx >= 0) return map.startRow + 1 + localIdx;
        }
      }
      return -1;
    }

    _renderPatientJourney(ctx, surgery, rowY, width) {
      const opt = this.options;
      const raw = surgery._raw || {};

      // 获取该手术的所有时序节点
      const surgeryEvents = this.timelineEvents.filter(e => e.surgeryId === surgery.sourceSurgeryId);

      // 辅助函数：从节点代码获取时间
      const getNodeTime = (codes, pick) => {
        const events = codes.map(code => surgeryEvents.find(e => e.nodeCode === code)).filter(Boolean);
        if (events.length === 0) return null;
        return events.reduce((acc, e) => {
          if (!acc) return e.actualTime;
          return pick === 'min' ? (e.actualTime < acc ? e.actualTime : acc) : (e.actualTime > acc ? e.actualTime : acc);
        }, null);
      };

      // 获取各阶段边界时间
      const preOpEnd = getNodeTime(['P7', 'T16'], 'min');
      const surgeryStart = getNodeTime(['T1'], 'min');
      const surgeryEnd = getNodeTime(['T8'], 'max');
      const recoveryStart = getNodeTime(['T17'], 'min');

      // 计算转运阶段的两段时间
      const transferSegments = [];
      // 术前转运：术前准备结束 -> 手术开始
      if (preOpEnd && surgeryStart && preOpEnd < surgeryStart) {
        transferSegments.push({ name: '术前转运', start: preOpEnd, end: surgeryStart });
      }
      // 术后转运：手术结束 -> 复苏开始
      if (surgeryEnd && recoveryStart && surgeryEnd < recoveryStart) {
        transferSegments.push({ name: '术后转运', start: surgeryEnd, end: recoveryStart });
      }

      // 4大阶段定义
      const phases = [
        {
          name: '术前准备',
          color: PHASE_COLORS.preop,
          startTime: getNodeTime(['P1'], 'min') || (raw.admissionTime ? Utils.parseLocalTime(raw.admissionTime, this.viewDate) : null),
          endTime: preOpEnd || (raw.transferInTime ? Utils.parseLocalTime(raw.transferInTime, this.viewDate) : null),
          allNodeCodes: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7']
        },
        {
          name: surgery.name || '手术进行',
          color: PHASE_COLORS.surgery,
          startTime: surgeryStart || surgery.actualStart,
          endTime: surgeryEnd || surgery.actualEnd,
          allNodeCodes: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15']
        },
        {
          name: '复苏',
          color: PHASE_COLORS.recovery,
          startTime: recoveryStart || (raw.recoveryStartTime ? Utils.parseLocalTime(raw.recoveryStartTime, this.viewDate) : null),
          endTime: getNodeTime(['T18'], 'max') || (raw.recoveryEndTime ? Utils.parseLocalTime(raw.recoveryEndTime, this.viewDate) : null),
          allNodeCodes: ['T17', 'T18']
        }
      ];

      // 转运阶段 - 可能包含两段（术前转运 + 术后转运）
      const transferPhase = {
        name: '转运',
        color: PHASE_COLORS.transfer,
        segments: transferSegments,
        allNodeCodes: ['T16', 'T1', 'T8', 'T17']
      };

      // 计算每个阶段的时间范围
      const phaseRanges = [];

      // 处理普通阶段
      phases.forEach(phase => {
        if (phase.startTime && phase.endTime && !isNaN(phase.startTime.getTime()) && !isNaN(phase.endTime.getTime())) {
          const milestones = surgeryEvents
            .filter(e => phase.allNodeCodes.includes(e.nodeCode))
            .map(e => ({
              nodeCode: e.nodeCode,
              nodeName: e.nodeName,
              actualTime: e.actualTime,
              plannedTime: e.plannedTime,
              category: e.category
            }))
            .sort((a, b) => a.actualTime - b.actualTime);

          phaseRanges.push({
            name: phase.name,
            color: phase.color,
            startTime: phase.startTime,
            endTime: phase.endTime,
            milestones
          });
        }
      });

      // 处理转运阶段（可能多段）
      if (transferSegments.length > 0) {
        const milestones = surgeryEvents
          .filter(e => transferPhase.allNodeCodes.includes(e.nodeCode))
          .map(e => ({
            nodeCode: e.nodeCode,
            nodeName: e.nodeName,
            actualTime: e.actualTime,
            plannedTime: e.plannedTime,
            category: e.category
          }))
          .sort((a, b) => a.actualTime - b.actualTime);

        transferSegments.forEach((seg, idx) => {
          phaseRanges.push({
            name: seg.name,
            color: transferPhase.color,
            startTime: seg.start,
            endTime: seg.end,
            milestones,
            isTransfer: true
          });
        });
      }

      // 按开始时间排序
      phaseRanges.sort((a, b) => a.startTime - b.startTime);

      if (phaseRanges.length === 0) return;

      // 绘制阶段条（占据行的中间区域）
      const phaseBarH = 28;
      const phaseBarY = this._patientBarY(surgery);

      phaseRanges.forEach(phase => {
        const startX = this._timeToX(phase.startTime);
        const endX = this._timeToX(phase.endTime);
        const phaseW = endX - startX;

        if (startX >= width || endX <= opt.Y_AXIS_WIDTH || phaseW <= 0) return;

        const drawX = Math.max(startX, opt.Y_AXIS_WIDTH);
        const drawW = Math.min(phaseW - (drawX - startX), phaseW);
        if (drawW <= 0) return;

        ctx.save();
        // 阶段条背景
        ctx.fillStyle = phase.color;
        ctx.strokeStyle = Utils.hexToRgba(phase.color, 0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();ctx.rect(drawX, phaseBarY, drawW, phaseBarH);
        ctx.fill();
        this._shadeBar(ctx);
        this._hoverBar(ctx, drawX, phaseBarY, drawW, phaseBarH);
        ctx.stroke();

        ctx.restore();

        phase._nodeMarkers = this._phaseNodeMarkers(phase.milestones, phaseBarY + phaseBarH / 2,
          Math.max(drawX, opt.Y_AXIS_WIDTH), Math.min(drawX + drawW, width));
        this._renderNodeMarkers(ctx, phase._nodeMarkers);
      });

      // 存储阶段范围用于hover检测
      surgery._phaseRanges = phaseRanges;
    }

    _renderPreOpNodes(ctx, surgery, rowY, width) {
      const opt = this.options;
      const preOpNodes = this.timelineEvents.filter(e =>
        e.surgeryId === surgery.sourceSurgeryId && e.nodeCode && e.nodeCode.startsWith('P')
      );
      if (!preOpNodes.length) return;

      const barSpacing = 3;
      const barY = rowY + (opt.ROW_HEIGHT - opt.TIME_BAR_HEIGHT * 2 - barSpacing) / 2;
      const preOpY = barY - 18;
      const preOpColor = opt.COLORS.timelineNode['术前'] || '#86efac';
      const shape = opt.NODE_SHAPES['术前'] || 'circle';
      const size = 4;

      preOpNodes.forEach((node, idx) => {
        let nodeTime;
        try {
          nodeTime = Utils.parseLocalTime(node.actualTime, this.viewDate);
        } catch (e) {
          return;
        }
        if (!nodeTime || isNaN(nodeTime.getTime())) return;

        const x = this._timeToX(nodeTime);
        const isBeforeView = nodeTime < this._getViewStart();

        // 如果节点在视图左侧之外，显示在左边缘
        let drawX = x;
        let isClipped = false;
        if (drawX < opt.Y_AXIS_WIDTH) {
          if (isBeforeView) {
            drawX = opt.Y_AXIS_WIDTH + 4;
            isClipped = true;
          } else {
            return;
          }
        }
        if (drawX > width) return;

        ctx.save();
        ctx.fillStyle = preOpColor;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        this._drawNodeShape(ctx, shape, drawX, preOpY, size);
        ctx.fill();
        ctx.stroke();

        // 节点代码标签
        ctx.fillStyle = preOpColor;
        ctx.font = '500 12px ui-monospace, SFMono-Regular, Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(node.nodeCode, drawX, preOpY - size - 1);

        // 如果被截断显示在边缘，标注日期
        const actualTimeStr = node.actualTime ? String(node.actualTime) : '';
        if (isClipped && actualTimeStr && actualTimeStr.includes(' ')) {
          const datePart = actualTimeStr.split(' ')[0];
          const shortDate = datePart.substring(5); // MM-DD
          ctx.fillStyle = opt.COLORS.textSecondary;
          ctx.font = '12px ui-monospace, SFMono-Regular, Consolas, monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(shortDate, drawX + size + 2, preOpY);
        }

        ctx.restore();
      });
    }

    _renderPlanBar(ctx, x, y, w, h, surgery) {
      const opt = this.options;
      ctx.save();

      const drawX = Math.max(x, opt.Y_AXIS_WIDTH);
      const drawW = Math.min(w - (drawX - x), w);
      if (drawW <= 0) { ctx.restore(); return; }

      // 虚线边框计划条
      ctx.fillStyle = opt.COLORS.planBar;
      ctx.strokeStyle = opt.COLORS.planBarBorder;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);

      ctx.beginPath();ctx.rect(drawX, y, drawW, h);
      ctx.fill();
      this._shadeBar(ctx);
      this._hoverBar(ctx, drawX, y, drawW, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // 手术名称
      if (drawW > 30) {
        ctx.fillStyle = opt.COLORS.textPrimary;
        ctx.font = opt.FONTS.barText;
        this._barTextShadow(ctx);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const text = surgery.name;
        const maxTextWidth = drawW - 8;
        const textWidth = Utils.measureText(ctx, text, opt.FONTS.barText);
        if (textWidth <= maxTextWidth) {
          ctx.fillText(text, drawX + 4, y + h / 2);
        } else {
          let truncated = text;
          while (truncated.length > 0 && Utils.measureText(ctx, truncated + '...', opt.FONTS.barText) > maxTextWidth) {
            truncated = truncated.slice(0, -1);
          }
          ctx.fillText(truncated + '...', drawX + 4, y + h / 2);
        }
      }
      ctx.restore();
    }

    _renderActualBar(ctx, x, y, w, h, surgery) {
      const opt = this.options;
      ctx.save();

      const drawX = Math.max(x, opt.Y_AXIS_WIDTH);
      const drawW = Math.min(w - (drawX - x), w);
      if (drawW <= 0) { ctx.restore(); return; }

      const baseColor = opt.COLORS.actualBar;


      ctx.fillStyle = baseColor;
      ctx.strokeStyle = Utils.hexToRgba(baseColor, 0.5);
      ctx.lineWidth = 1;

      ctx.beginPath();ctx.rect(drawX, y, drawW, h);
      ctx.fill();
      this._shadeBar(ctx);
      this._hoverBar(ctx, drawX, y, drawW, h);
      ctx.stroke();

      // 状态文字
      if (drawW > 40 && this.selectedSurgery?.id !== surgery.id) {
        ctx.fillStyle = BAR_TEXT;
        ctx.font = opt.FONTS.barText;
        this._barTextShadow(ctx);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const statusText = surgery.status === 'completed' ? '已完成' :
                           surgery.status === 'in-progress' ? '进行中' : '计划中';
        ctx.fillText(statusText, drawX + drawW - 4, y + h / 2);
      }
      ctx.restore();
    }

    _getResourceBars(surgery) {
      const range = (start, end) => {
        if (!start || !end || !Number.isFinite(+start) || !Number.isFinite(+end) || end <= start) return null;
        const x = this._timeToX(start);
        return {x, w:this._timeToX(end) - x};
      };
      return {plan:range(surgery.planStart, surgery.planEnd), actual:range(surgery.actualStart, surgery.actualEnd || surgery.actualProgressEnd)};
    }

    _renderDeviation(ctx, surgery, planX, planW, actualX, actualW, barY) {
      const opt = this.options, height = opt.TIME_BAR_HEIGHT * 2 + 3;
      const labelX = Math.max(planX + planW, actualX + actualW) + 4;
      ctx.save();
      // Compare each endpoint independently. Progress is not an actual finishing time.
      for (const [plan, actual, label, labelY] of [
        [surgery.planStart, surgery.actualStart, '开', barY + opt.TIME_BAR_HEIGHT / 2],
        [surgery.planEnd, surgery.actualEnd, '终', barY + opt.TIME_BAR_HEIGHT * 1.5 + 3]
      ]) {
        if (!plan || !actual) continue;
        const diff = Utils.diffMinutes(plan, actual);
        if (!diff) continue;
        const x1 = this._timeToX(plan), x2 = this._timeToX(actual);
        const color = diff > 0 ? opt.COLORS.deviationLate : opt.COLORS.deviationEarly;
        ctx.fillStyle = Utils.hexToRgba(color, DEVIATION_FILL_ALPHA);
        ctx.fillRect(Math.min(x1, x2), barY, Math.abs(x2 - x1), height);
        ctx.fillStyle = color;
        ctx.font = opt.FONTS.deviation;
        ctx.textAlign = 'left';ctx.textBaseline = 'middle';
        ctx.fillText(`${label}${diff > 0 ? '+' : ''}${diff}分`, labelX, labelY);
      }
      ctx.restore();
    }

    _renderConflictWave(ctx, x, y, w, h) {
      const opt = this.options;
      ctx.save();
      ctx.strokeStyle = opt.COLORS.conflictWave;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const waveLength = 6;
      const amplitude = 2;
      const steps = Math.ceil(w / waveLength);

      for (let i = 0; i <= steps; i++) {
        const px = x + i * waveLength;
        const py = y + (i % 2 === 0 ? 0 : amplitude);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = Utils.hexToRgba(opt.COLORS.conflictWave, 0.08);
      ctx.fillRect(x, y - 2, w, h + 4);
      ctx.restore();
    }

    _getTimelineNodeMarkers(surgery, width) {
      if (this.groupBy === 'patient' || !surgery?.actualStart) return [];
      const end = surgery.actualEnd || surgery.actualProgressEnd;
      if (!end || end < surgery.actualStart) return [];
      const opt = this.options, rowY = this._rowToY(surgery._rowIndex);
      const barY = rowY + (opt.ROW_HEIGHT - opt.TIME_BAR_HEIGHT * 2 - 3) / 2;
      const y = barY + opt.TIME_BAR_HEIGHT * 1.5 + 3;
      const nodes = this.timelineEvents.filter(node => node.surgeryId === surgery.sourceSurgeryId &&
        node.actualTime >= surgery.actualStart && node.actualTime <= end).sort((a, b) => a.actualTime - b.actualTime);
      const markers = [];
      for (const node of nodes) {
        const x = this._timeToX(node.actualTime);
        if (x < opt.Y_AXIS_WIDTH || x > width) continue;
        const previous = markers.at(-1);
        // Keep the first node at its exact time; nearby nodes share its count marker.
        if (previous && x - previous.x < 18) previous.nodes.push(node);
        else markers.push({x, y, nodes:[node]});
      }
      return markers;
    }

    _renderTimelineNodes(ctx, surgery, row, rowY, width) {
      this._renderNodeMarkers(ctx, this._getTimelineNodeMarkers(surgery, width));
    }

    _renderNodeMarkers(ctx, markers) {
      const opt = this.options;
      for (const marker of markers) {
        const node = marker.nodes[0], grouped = marker.nodes.length > 1;
        const color = opt.COLORS.timelineNode[node.category] || opt.COLORS.textPrimary;
        ctx.save();
        ctx.fillStyle = grouped ? opt.COLORS.tooltipBg : color;
        ctx.strokeStyle = grouped ? opt.COLORS.textPrimary : '#ffffff';
        ctx.lineWidth = 1.5;
        this._drawNodeShape(ctx, grouped ? 'circle' : opt.NODE_SHAPES[node.category] || 'circle', marker.x, marker.y, grouped ? 8 : 4);
        ctx.fill();ctx.stroke();
        if (grouped) {
          ctx.fillStyle = opt.COLORS.textPrimary;ctx.font = opt.FONTS.barText;
          ctx.textAlign = 'center';ctx.textBaseline = 'middle';
          ctx.fillText(String(marker.nodes.length), marker.x, marker.y);
        }
        ctx.restore();
      }
    }

    _drawNodeShape(ctx, shape, x, y, size) {
      ctx.beginPath();
      switch (shape) {
        case 'circle':
          ctx.arc(x, y, size, 0, Math.PI * 2);
          break;
        case 'diamond':
          ctx.moveTo(x, y - size);
          ctx.lineTo(x + size, y);
          ctx.lineTo(x, y + size);
          ctx.lineTo(x - size, y);
          ctx.closePath();
          break;
        case 'rect':
          ctx.rect(x - size, y - size, size * 2, size * 2);
          break;
        case 'triangle':
          ctx.moveTo(x, y - size);
          ctx.lineTo(x + size, y + size);
          ctx.lineTo(x - size, y + size);
          ctx.closePath();
          break;
        case 'pentagon':
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
        case 'hexagon':
          for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI / 6);
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
        case 'star':
          for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI / 5) - Math.PI / 2;
            const r = i % 2 === 0 ? size : size * 0.5;
            const px = x + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
        case 'arrow':
          ctx.moveTo(x, y - size);
          ctx.lineTo(x + size * 0.7, y + size * 0.3);
          ctx.lineTo(x + size * 0.3, y + size * 0.3);
          ctx.lineTo(x + size * 0.3, y + size);
          ctx.lineTo(x - size * 0.3, y + size);
          ctx.lineTo(x - size * 0.3, y + size * 0.3);
          ctx.lineTo(x - size * 0.7, y + size * 0.3);
          ctx.closePath();
          break;
        default:
          ctx.arc(x, y, size, 0, Math.PI * 2);
      }
    }

    _renderEventMarkers(ctx, width, height) {
      const opt = this.options;
      const totalRows = this._getTotalRows();
      const firstVisibleRow = Math.max(0, this._yToRow(opt.HEADER_HEIGHT));
      const lastVisibleRow = Math.min(totalRows - 1, this._yToRow(height));

      this.eventMarkers.forEach(marker => {
        const surgery = this.data.find(s => s.sourceSurgeryId === marker.surgeryId);
        if (!surgery) return;

        const row = surgery._rowIndex;
        if (row < firstVisibleRow || row > lastVisibleRow) return;

        const x = this._timeToX(marker.time);
        if (x < opt.Y_AXIS_WIDTH || x > width) return;

        const y = this.groupBy === 'patient' ? this._patientBarY(surgery) + 14 : this._rowToY(row) + opt.ROW_HEIGHT / 2;

        ctx.save();
        if (marker.type === 'safety-check-fail') {
          ctx.fillStyle = opt.COLORS.safetyCheckFail;
          ctx.beginPath();
          ctx.moveTo(x, y - 14);
          ctx.lineTo(x - 5, y - 5);
          ctx.lineTo(x + 5, y - 5);
          ctx.closePath();
          ctx.fill();
        } else if (marker.type === 'adverse-event') {
          ctx.fillStyle = opt.COLORS.adverseEvent;
          ctx.beginPath();
          ctx.moveTo(x, y - 14);
          ctx.lineTo(x + 5, y - 9);
          ctx.lineTo(x, y - 4);
          ctx.lineTo(x - 5, y - 9);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });
    }

    _renderSelection(ctx) {
      const opt = this.options;
      const surgery = this.selectedSurgery;
      const row = surgery._rowIndex;
      const y = this._rowToY(row);

      ctx.save();
      ctx.strokeStyle = opt.COLORS.selectedBorder;
      ctx.lineWidth = 2;

      // 患者视图：高亮4大阶段条
      if (this.groupBy === 'patient' && surgery._phaseRanges) {
        const phaseBarH = 28;
        const phaseBarY = this._patientBarY(surgery);

        const ranges = surgery._phaseRanges
          .map(phase => ({start:this._timeToX(phase.startTime),end:this._timeToX(phase.endTime)}))
          .filter(range => Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start);
        if (ranges.length) {
          const canvasWidth = ctx.canvas.width / (window.devicePixelRatio || 1);
          const left = Math.max(opt.Y_AXIS_WIDTH + 1, Math.min(...ranges.map(range => range.start)) - 2);
          const right = Math.min(canvasWidth - 1, Math.max(...ranges.map(range => range.end)) + 2);
          if (right > left) ctx.strokeRect(left, phaseBarY - 2, right - left, phaseBarH + 4);
        }
      } else {
        // Include the actual bar's early start / late finish in the selection bounds.
        const {plan, actual} = this._getResourceBars(surgery);
        const bars = [plan, actual].filter(Boolean);
        if (!bars.length) {ctx.restore(); return;}
        const planX = Math.min(...bars.map(b => b.x));
        const planW = Math.max(...bars.map(b => b.x + b.w)) - planX;

        ctx.setLineDash([4, 3]);
        ctx.strokeRect(planX - 2, y + 2, planW + 4, opt.ROW_HEIGHT - 4);
        ctx.setLineDash([]);

        // 发光效果
        ctx.shadowColor = opt.COLORS.selectedBorder;
        ctx.shadowBlur = 8;
        ctx.strokeRect(planX - 2, y + 2, planW + 4, opt.ROW_HEIGHT - 4);

        // If expanded, draw a bracket around the sub-task area
        if (this.expandedGroup) {
          const group = this._getGroupAtRow(row);
          if (group && this.expandedGroup === group.name && group.totalRows > 1) {
            const subAreaY = y + opt.ROW_HEIGHT;
            const subAreaH = (group.totalRows - 1) * opt.SUB_ROW_HEIGHT * this._expandedProgress;
            ctx.strokeStyle = Utils.hexToRgba(opt.COLORS.selectedBorder, 0.3);
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(planX - 2, subAreaY, planW + 4, subAreaH);
            ctx.setLineDash([]);
          }
        }
      }

      ctx.restore();
    }

    _renderTooltip(ctx) {
      const opt = this.options;
      const surgery = this.hoveredSurgery;
      if (!surgery) return;

      const lines = [
        { text: surgery.name, font: opt.FONTS.tooltipTitle, color: opt.COLORS.tooltipText },
        { text: `患者: ${surgery.patient}`, font: opt.FONTS.tooltip, color: opt.COLORS.tooltipText },
        { text: `主刀: ${surgery.doctor}`, font: opt.FONTS.tooltip, color: opt.COLORS.tooltipText },
        { text: `计划: ${Utils.formatTime(surgery.planStart)} - ${Utils.formatTime(surgery.planEnd)}`, font: opt.FONTS.tooltip, color: opt.COLORS.textSecondary }
      ];

      if (surgery.actualStart) {
        const end = surgery.actualEnd || surgery.actualProgressEnd;
        lines.push({
          text: end ? `实际: ${Utils.formatTime(surgery.actualStart)} - ${Utils.formatTime(end)}${surgery.actualEnd ? '' : '（进行中，截至快照）'}` : `实际开始: ${Utils.formatTime(surgery.actualStart)}（未结束）`,
          font: opt.FONTS.tooltip, color: opt.COLORS.textSecondary
        });
        for (const [label, plan, actual] of [['开始', surgery.planStart, surgery.actualStart], ['结束', surgery.planEnd, surgery.actualEnd]]) {
          if (!plan || !actual) continue;
          const diff = Utils.diffMinutes(plan, actual);
          lines.push({text:`${label}${diff === 0 ? '准时' : `${diff > 0 ? '延时' : '提前'} ${Math.abs(diff)} 分钟`}`, font:opt.FONTS.tooltip,
            color:diff === 0 ? opt.COLORS.textSecondary : diff > 0 ? opt.COLORS.deviationLate : opt.COLORS.deviationEarly});
        }
      }

      this._drawTooltip(ctx, lines);
    }

    _renderNodeTooltip(ctx) {
      const opt = this.options;
      const node = this.hoveredTimelineNode;
      if (!node) return;

      const lines = node.nodes ? [
        {text:`${node.nodes.length} 个相邻节点`, font:opt.FONTS.tooltipTitle, color:opt.COLORS.tooltipText},
        ...node.nodes.map(item => ({text:`${item.nodeCode} ${item.nodeName} · ${Utils.formatTime(item.actualTime)}`, font:opt.FONTS.tooltip, color:opt.COLORS.tooltipText})),
        {text:+node.nodes[0].actualTime === +node.nodes.at(-1).actualTime ? '同一时刻的节点合并显示' : '放大时间轴可分开相邻时点', font:opt.FONTS.tooltip, color:opt.COLORS.textSecondary}
      ] : [
        { text: `${node.nodeCode} ${node.nodeName}`, font: opt.FONTS.tooltipTitle, color: opt.COLORS.tooltipText },
        { text: `类别: ${node.category}`, font: opt.FONTS.tooltip, color: opt.COLORS.textSecondary },
        { text: `计划时间: ${Utils.formatTime(node.plannedTime)}`, font: opt.FONTS.tooltip, color: opt.COLORS.textSecondary },
        { text: `实际时间: ${Utils.formatTime(node.actualTime)}`, font: opt.FONTS.tooltip, color: opt.COLORS.tooltipText }
      ];

      if (!node.nodes && node.deviation !== 0) {
        lines.push({
          text: `偏差: ${node.deviation > 0 ? '+' : ''}${node.deviation}分钟`,
          font: opt.FONTS.tooltip,
          color: node.deviation > 0 ? opt.COLORS.deviationLate : opt.COLORS.deviationEarly
        });
      }

      this._drawTooltip(ctx, lines);
    }

    _renderPhaseTooltip(ctx) {
      const opt = this.options;
      const hoverInfo = this.hoveredPhaseSubTask;
      if (!hoverInfo) return;

      const lines = [];

      if (hoverInfo.type === 'milestone') {
        // 悬停在里程碑上：显示里程碑详情
        const ms = hoverInfo.milestone;
        const phaseName = hoverInfo.subTask ? hoverInfo.subTask.nodeName : (hoverInfo.phase ? hoverInfo.phase.name : '');
        const phaseColor = hoverInfo.subTask ? hoverInfo.subTask.color : (hoverInfo.phase ? hoverInfo.phase.color : '#aaaaaa');
        lines.push(
          { text: `${ms.nodeCode} ${ms.nodeName}`, font: opt.FONTS.tooltipTitle, color: opt.COLORS.tooltipText },
          { text: `所属阶段: ${phaseName}`, font: opt.FONTS.tooltip, color: opt.COLORS.textSecondary },
          { text: `实际时间: ${Utils.formatTime(ms.actualTime)}`, font: opt.FONTS.tooltip, color: opt.COLORS.tooltipText }
        );
        if (ms.plannedTime) {
          lines.push({ text: `计划时间: ${Utils.formatTime(ms.plannedTime)}`, font: opt.FONTS.tooltip, color: opt.COLORS.textSecondary });
        }
      } else {
        // 悬停在阶段条上：显示阶段信息和所有里程碑
        const phase = hoverInfo.subTask || hoverInfo.phase;
        if (!phase) return;
        lines.push(
          { text: phase.nodeName || phase.name, font: opt.FONTS.tooltipTitle, color: opt.COLORS.tooltipText },
          { text: `时间: ${Utils.formatTime(phase.actualStart || phase.startTime)} - ${Utils.formatTime(phase.actualEnd || phase.endTime)}`, font: opt.FONTS.tooltip, color: opt.COLORS.tooltipText }
        );
        const milestones = phase.milestones;
        if (milestones && milestones.length > 0) {
          lines.push({ text: '里程碑', font: opt.FONTS.tooltip, color: opt.COLORS.textSecondary, gapBefore:8 });
          milestones.forEach(ms => {
            lines.push({
              text: `${ms.nodeCode} ${ms.nodeName}  ${Utils.formatTime(ms.actualTime)}`,
              font: opt.FONTS.tooltip,
              color: opt.COLORS.tooltipText
            });
          });
        }
      }

      this._drawTooltip(ctx, lines);
    }

    _drawTooltip(ctx, lines) {
      const opt = this.options, padding = 16;
      const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
      const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
      let maxWidth = 0, contentHeight = 0;
      ctx.save();
      lines.forEach((line, index) => {
        ctx.font = line.font;
        maxWidth = Math.max(maxWidth, ctx.measureText(line.text).width);
        contentHeight += (index === 0 ? 32 : 24) + (line.gapBefore || 0);
      });
      const tooltipW = maxWidth + padding * 2, tooltipH = contentHeight + padding * 2;
      let x = this.mouseX + 16, y = this.mouseY + 16;
      if (x + tooltipW > canvasWidth - 8) x = this.mouseX - tooltipW - 12;
      if (y + tooltipH > canvasHeight - 8) y = this.mouseY - tooltipH - 12;
      x = Math.max(8, Math.min(x, canvasWidth - tooltipW - 8));
      y = Math.max(8, Math.min(y, canvasHeight - tooltipH - 8));
      ctx.fillStyle = opt.COLORS.tooltipBg;ctx.strokeStyle = opt.COLORS.tooltipBorder;ctx.lineWidth = 1;
      ctx.shadowColor = 'rgba(0,0,0,0.25)';ctx.shadowBlur = 12;ctx.shadowOffsetY = 4;
      this._roundRect(ctx, x, y, tooltipW, tooltipH, 8);ctx.fill();ctx.stroke();
      ctx.shadowColor = 'transparent';ctx.shadowBlur = 0;ctx.shadowOffsetY = 0;
      let lineY = y + padding;
      lines.forEach((line, index) => {
        lineY += line.gapBefore || 0;
        ctx.font = line.font;ctx.fillStyle = line.color;
        ctx.textAlign = 'left';ctx.textBaseline = 'top';
        ctx.fillText(line.text, x + padding, lineY);
        lineY += index === 0 ? 32 : 24;
      });
      ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    _listen(target, name, handler, options) {
      target.addEventListener(name, handler, options);
      this._listeners.push({target, name, handler, options});
    }

    _bindEvents() {
      const canvas = this.canvas;
      this._listen(canvas, 'mousemove', e => this._onMouseMove(e));
      this._listen(canvas, 'mousedown', e => this._onMouseDown(e));
      this._listen(canvas, 'mouseup', e => this._onMouseUp(e));
      this._listen(canvas, 'mouseleave', () => this._onMouseLeave());
      this._listen(canvas, 'wheel', e => this._onWheel(e), {passive: false});
      this._listen(canvas, 'click', e => this._onClick(e));
      this._listen(canvas, 'dblclick', () => this._onDoubleClick());
      this._listen(canvas, 'keydown', e => this._onKeyDown(e));
    }

    _onMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.mouseX = (e.clientX - rect.left);
      this.mouseY = (e.clientY - rect.top);

      if (this.isDragging) {
        const dx = this.mouseX - this.dragStartX;
        const dy = this.mouseY - this.dragStartY;
        if (Math.abs(dx) + Math.abs(dy) > 4) this.didDrag = true;
        this.offsetX = this.dragStartOffsetX + dx;
        this.offsetY = this.dragStartOffsetY + dy;
        this._requestRender();
        return;
      }

      const prevHover = this.hoveredSurgery;
      const prevNodeHover = this.hoveredTimelineNode;
      const prevPhaseHover = this.hoveredPhaseSubTask;
      this.hoveredSurgery = this._hitTest(this.mouseX, this.mouseY);
      this.hoveredTimelineNode = this._hitTestTimelineNode(this.mouseX, this.mouseY);
      this.hoveredPhaseSubTask = this._hitTestPhaseSubTask(this.mouseX, this.mouseY);

      // Show pointer cursor in Y-axis area for expand/collapse
      const canvasEl = this.canvas;
      canvasEl.title = '';
      const inYAxis = this.mouseX < this.options.Y_AXIS_WIDTH && this.mouseY >= this.options.HEADER_HEIGHT;
      if (inYAxis) {
        if (prevHover || prevNodeHover || prevPhaseHover) this._requestRender();
        const row = this._yToRow(this.mouseY);
        const group = this._getGroupAtRow(row);
        if (group && !this._isSubRow(row)) {
          canvasEl.style.cursor = 'pointer';
          if (this.groupBy === 'patient') canvasEl.title = group.name + ' · ' + group.surgeries.length + '台\n' + group.surgeries.map(s=>s.name).join('\n');
          else if (this.groupBy === 'equipment' || this.groupBy === 'pacu') canvasEl.title = String(group.name);
        } else {
          canvasEl.style.cursor = 'default';
        }
      } else if (prevHover !== this.hoveredSurgery || prevNodeHover !== this.hoveredTimelineNode || prevPhaseHover !== this.hoveredPhaseSubTask) {
        canvasEl.style.cursor = (this.hoveredSurgery || this.hoveredTimelineNode || this.hoveredPhaseSubTask) ? 'pointer' : 'default';
        this._requestRender();
      } else if (this.hoveredSurgery || this.hoveredTimelineNode || this.hoveredPhaseSubTask) {
        this._requestRender();
      }
    }

    _onMouseDown(e) {
      if (e.button === 0) {
        this.canvas.focus();
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.didDrag = false;
        this.isDragging = true;
        this.dragStartX = this.mouseX;
        this.dragStartY = this.mouseY;
        this.dragStartOffsetX = this.offsetX;
        this.dragStartOffsetY = this.offsetY;
        this.canvas.style.cursor = 'grabbing';
      }
    }

    _onMouseUp(e) {
      this.isDragging = false;
      this.canvas.style.cursor = this.hoveredSurgery ? 'pointer' : 'default';
    }

    _onMouseLeave() {
      this.isDragging = false;
      this.hoveredSurgery = null;
      this.hoveredTimelineNode = null;
      this.hoveredPhaseSubTask = null;
      this.canvas.title = '';
      this._requestRender();
    }

    _onWheel(e) {
      e.preventDefault();
      if (e.ctrlKey) {
        const zoomFactor = e.deltaY > 0 ? (1 - this.options.ZOOM_STEP) : (1 + this.options.ZOOM_STEP);
        const newScale = Utils.clamp(this.scale * zoomFactor, this.options.MIN_ZOOM, this.options.MAX_ZOOM);
        const mouseTime = this._xToTime(this.mouseX).getTime();
        const viewStart = this._getViewStart().getTime();
        const oldPixelsPerMs = (this.options.PIXELS_PER_HOUR * this.scale) / 3600000;
        const newPixelsPerMs = (this.options.PIXELS_PER_HOUR * newScale) / 3600000;
        const relX = (mouseTime - viewStart) * oldPixelsPerMs;
        const newRelX = (mouseTime - viewStart) * newPixelsPerMs;
        this.offsetX += relX - newRelX;
        this.scale = newScale;
        this._emit('viewport', {scale:this.scale});
      } else {
        this.offsetX -= e.deltaX;
        this.offsetY -= e.deltaY;
      }
      this._requestRender();
    }

    _onClick(e) {
      if (this.isDragging || this.didDrag) { this.didDrag = false; return; }

      const rect = this.canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left);
      const clickY = (e.clientY - rect.top);

      // Check if click is in Y-axis area (expand/collapse group)
      if (clickX < this.options.Y_AXIS_WIDTH && clickY >= this.options.HEADER_HEIGHT) {
        const row = this._yToRow(clickY);
        const group = this._getGroupAtRow(row);
        if (group && !this._isSubRow(row)) {
          if (this.groupBy === 'pacu') {
            const recovery = group.surgeries.find(item => item.status === 'in-progress') || group.surgeries[0];
            if (recovery) {
              this.selectedSurgery = recovery;
              this._emit('select', { surgery: recovery });
              this._requestRender();
            }
            return;
          }
          this._toggleGroup(group);
          return;
        }
        return;
      }

      const nodeHit = this._hitTestTimelineNode(clickX, clickY);
      if (nodeHit) {
        this.hoveredTimelineNode = nodeHit;
        this._emit('select', {surgery:this.selectedSurgery});
        this._requestRender();
        return;
      }

      // 患者主条带与展开阶段都关联到同一台手术。
      if (this.groupBy === 'patient' && clickX >= this.options.Y_AXIS_WIDTH && clickY >= this.options.HEADER_HEIGHT) {
        const phaseHit = this._hitTestPhaseSubTask(clickX, clickY);
        const surgery = phaseHit?.surgery || (phaseHit?.subTask && this.data.find(s => s.id === phaseHit.subTask.surgeryId));
        if (surgery) {
          this.selectedSurgery = surgery;
          this._emit('select', { surgery });
          this._requestRender();
          return;
        }
      }

      // 非患者视图：检测手术计划/实际条
      const hit = this._hitTest(clickX, clickY);
      if (hit) {
        this.selectedSurgery = hit;
        this._emit('select', { surgery: hit });
        this._requestRender();
        return;
      }

      if (clickX >= this.options.Y_AXIS_WIDTH && clickY >= this.options.HEADER_HEIGHT) {
        this.selectedTime = this._xToTime(clickX);
      } else {
        this.selectedTime = null;
      }
      if (this.selectedSurgery) {
        this.selectedSurgery = null;
      }
      this._emit('select', {surgery:null});
      this._emit('timeSelect', {time:this.selectedTime});
      this._requestRender();
    }

    _buildSubTasks(group) {
      // 患者视图：4个大阶段（术前准备、转运、手术进行、复苏）
      if (this.groupBy === 'patient') {
        return this._buildPatientPhaseSubTasks(group);
      }

      const subTasks = [];
      const categoryColors = this.options.COLORS.timelineNode || {};

      // Define sub-task ranges: each range has a start node and end node
      // Grouped by category for each surgery
      const subTaskRanges = [
        { nodeCodes: ['T1', 'T1'], category: '入室', label: '患者入室' },
        { nodeCodes: ['T2', 'T7'], category: '麻醉', label: '麻醉阶段' },
        { nodeCodes: ['T3', 'T6'], category: '手术', label: '手术阶段' },
        { nodeCodes: ['T9', 'T10'], category: '清点', label: '器械清点' },
        { nodeCodes: ['T11', 'T13'], category: '核查', label: '安全核查' },
        { nodeCodes: ['T8', 'T15'], category: '出室', label: '出室交接' }
      ];

      group.surgeries.forEach(surgery => {
        const surgeryEvents = this.timelineEvents.filter(e => e.surgeryId === surgery.sourceSurgeryId);

        subTaskRanges.forEach(range => {
          const startEvent = surgeryEvents.find(e => e.nodeCode === range.nodeCodes[0]);
          const endEvent = surgeryEvents.find(e => e.nodeCode === range.nodeCodes[1]);

          if (startEvent && endEvent) {
            const color = categoryColors[range.category] || '#aaaaaa';
            subTasks.push({
              id: `sub-${surgery.id}-${range.category}`,
              surgeryId: surgery.id,
              surgeryName: surgery.name,
              nodeCode: range.nodeCodes[0] === range.nodeCodes[1]
                ? range.nodeCodes[0]
                : `${range.nodeCodes[0]}-${range.nodeCodes[1]}`,
              nodeName: range.label,
              category: range.category,
              planStart: startEvent.plannedTime,
              planEnd: endEvent.plannedTime,
              actualStart: startEvent.actualTime,
              actualEnd: endEvent.actualTime,
              color: color,
              parentGroupName: group.name
            });
          } else if (startEvent && range.nodeCodes[0] === range.nodeCodes[1]) {
            // Single node (like T1)
            const color = categoryColors[range.category] || '#aaaaaa';
            subTasks.push({
              id: `sub-${surgery.id}-${range.category}`,
              surgeryId: surgery.id,
              surgeryName: surgery.name,
              nodeCode: range.nodeCodes[0],
              nodeName: range.label,
              category: range.category,
              planStart: startEvent.plannedTime,
              planEnd: startEvent.plannedTime,
              actualStart: startEvent.actualTime,
              actualEnd: startEvent.actualTime,
              color: color,
              parentGroupName: group.name
            });
          }
        });
      });

      return subTasks;
    }

    _buildPatientPhaseSubTasks(group) {
      const subTasks = [];
      group.surgeries.forEach(surgery => {
        const surgeryEvents = this.timelineEvents.filter(e => e.surgeryId === surgery.sourceSurgeryId);
        const raw = surgery._raw || {};

        // 辅助函数：从节点代码获取时间
        const getNodeTime = (codes, pick) => {
          const events = codes.map(code => surgeryEvents.find(e => e.nodeCode === code)).filter(Boolean);
          if (events.length === 0) return null;
          return events.reduce((acc, e) => {
            if (!acc) return e.actualTime;
            return pick === 'min' ? (e.actualTime < acc ? e.actualTime : acc) : (e.actualTime > acc ? e.actualTime : acc);
          }, null);
        };

        // 获取各阶段边界时间
        const preOpEnd = getNodeTime(['P7', 'T16'], 'min');
        const surgeryStart = getNodeTime(['T1'], 'min');
        const surgeryEnd = getNodeTime(['T8'], 'max');
        const recoveryStart = getNodeTime(['T17'], 'min');

        // 计算转运阶段的两段时间
        const transferSegments = [];
        transferSegments.push({name:'术前转运',start:preOpEnd,end:surgeryStart});
        transferSegments.push({name:'术后转运',start:surgeryEnd,end:recoveryStart});

        // 普通阶段定义；术前、术后转运独立插入展示顺序。
        const phaseDefinitions = [
          {
            category: '术前准备',
            label: '术前准备',
            startNodeCodes: ['P1'],
            endNodeCodes: ['P7', 'T16'],
            nodeCodes: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'],
            color: PHASE_COLORS.preop,
            getTime: () => ({
              start: getNodeTime(['P1'], 'min') || (raw.admissionTime ? Utils.parseLocalTime(raw.admissionTime, this.viewDate) : null),
              end: preOpEnd || (raw.transferInTime ? Utils.parseLocalTime(raw.transferInTime, this.viewDate) : null)
            })
          },
          {
            category: '手术进行',
            label: surgery.name || '手术进行',
            startNodeCodes: ['T1'],
            endNodeCodes: ['T8'],
            nodeCodes: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15'],
            color: PHASE_COLORS.surgery,
            getTime: () => ({
              start: surgeryStart || surgery.actualStart,
              end: surgeryEnd || surgery.actualEnd
            })
          },
          {
            category: '复苏',
            label: '复苏',
            startNodeCodes: ['T17'],
            endNodeCodes: ['T18'],
            nodeCodes: ['T17', 'T18'],
            color: PHASE_COLORS.recovery,
            getTime: () => ({
              start: recoveryStart || (raw.recoveryStartTime ? Utils.parseLocalTime(raw.recoveryStartTime, this.viewDate) : null),
              end: getNodeTime(['T18'], 'max') || (raw.recoveryEndTime ? Utils.parseLocalTime(raw.recoveryEndTime, this.viewDate) : null)
            })
          }
        ];

        // 处理普通阶段
        phaseDefinitions.forEach(phase => {
          const phaseEvents = surgeryEvents.filter(e => phase.nodeCodes.includes(e.nodeCode));
          const times = phase.getTime();
          let actualStart = times.start;
          let actualEnd = times.end;

          // 尝试用节点事件确定计划时间
          const startEvents = phase.startNodeCodes.map(code => surgeryEvents.find(e => e.nodeCode === code)).filter(Boolean);
          const endEvents = phase.endNodeCodes.map(code => surgeryEvents.find(e => e.nodeCode === code)).filter(Boolean);
          let planStart = null;
          let planEnd = null;

          if (startEvents.length > 0) {
            planStart = startEvents.reduce((min, e) => !min || e.plannedTime < min ? e.plannedTime : min, null);
          }
          if (endEvents.length > 0) {
            planEnd = endEvents.reduce((max, e) => !max || e.plannedTime > max ? e.plannedTime : max, null);
          }

          {
            const milestones = phaseEvents.map(e => ({
              nodeCode: e.nodeCode,
              nodeName: e.nodeName,
              actualTime: e.actualTime,
              plannedTime: e.plannedTime,
              category: e.category
            })).sort((a, b) => a.actualTime - b.actualTime);

            subTasks.push({
              id: `sub-${surgery.id}-${phase.category}`,
              surgeryId: surgery.id,
              surgeryName: surgery.name,
              nodeCode: phase.nodeCodes.join(','),
              nodeName: phase.label,
              category: phase.category,
              planStart: planStart,
              planEnd: planEnd,
              actualStart: actualStart,
              actualEnd: actualEnd,
              color: phase.color,
              parentGroupName: group.name,
              milestones: milestones,
              isPhaseSubTask: true
            });
          }
        });

        // 处理转运阶段（可能多段）
        if (transferSegments.length > 0) {
          const transferMilestones = surgeryEvents
            .filter(e => ['T16', 'T1', 'T8', 'T17'].includes(e.nodeCode))
            .map(e => ({
              nodeCode: e.nodeCode,
              nodeName: e.nodeName,
              actualTime: e.actualTime,
              plannedTime: e.plannedTime,
              category: e.category
            }))
            .sort((a, b) => a.actualTime - b.actualTime);

          transferSegments.forEach((seg, idx) => {
            subTasks.push({
              id: `sub-${surgery.id}-转运-${idx}`,
              surgeryId: surgery.id,
              surgeryName: surgery.name,
              nodeCode: 'T16,T1,T8,T17',
              nodeName: seg.name,
              category: seg.name,
              planStart: null,
              planEnd: null,
              actualStart: seg.start && seg.end && seg.end > seg.start ? seg.start : null,
              actualEnd: seg.start && seg.end && seg.end > seg.start ? seg.end : null,
              color: PHASE_COLORS.transfer,
              parentGroupName: group.name,
              milestones: transferMilestones,
              isPhaseSubTask: true
            });
          });
        }
      });

      const order=['术前准备','术前转运','手术进行','复苏','术后转运'];
      return subTasks.sort((a,b)=>group.surgeries.findIndex(s=>s.id===a.surgeryId)-group.surgeries.findIndex(s=>s.id===b.surgeryId)||order.indexOf(a.category)-order.indexOf(b.category));
    }

    _onDoubleClick() {
      this._cancelExpansion();
      this.scale = 1;
      this._emit('viewport', {scale:this.scale});
      this.offsetX = 0;
      this.offsetY = 0;
      this.expandedGroup = null;
      this.subTasks = [];
      this._rebuildGroupRowMap();
      this._requestRender();
    }

    _onKeyDown(e) {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Enter'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') this.offsetX += 80;
        if (e.key === 'ArrowRight') this.offsetX -= 80;
        if (e.key === 'ArrowUp') this.offsetY += 56;
        if (e.key === 'ArrowDown') this.offsetY -= 56;
        if (e.key === '+' || e.key === '=') this.setScale(this.scale * 1.2);
        if (e.key === '-') this.setScale(this.scale / 1.2);
        if (e.key === 'Enter') this._onDoubleClick();
        this._requestRender();
      }
      if (e.key === 'Escape') {
        this.selectedSurgery = null;
        this.selectedTime = null;
        this._emit('select', {surgery:null});
        this._emit('timeSelect', {time:null});
        this._requestRender();
      }
    }

    _hitTest(x, y) {
      const opt = this.options;
      if (x < opt.Y_AXIS_WIDTH || y < opt.HEADER_HEIGHT) return null;
      const row = this._yToRow(y);
      if (row < 0 || row >= this._getTotalRows()) return null;

      // Skip sub-rows for hit testing on surgery bars
      if (this._isSubRow(row)) return null;

      const group = this._getGroupAtRow(row);
      if (!group) return null;

      for (const surgery of group.surgeries) {
        const rowY = this._rowToY(surgery._rowIndex);
        if (this.groupBy === 'patient') {
          const top=this._patientBarY(surgery);
          if(y>=top&&y<=top+28&&(surgery._phaseRanges||[]).some(phase=>x>=this._timeToX(phase.startTime)&&x<=this._timeToX(phase.endTime)))return surgery;
          continue;
        }
        const {plan, actual} = this._getResourceBars(surgery);
        const barY = rowY + (opt.ROW_HEIGHT - opt.TIME_BAR_HEIGHT * 2 - 3) / 2;
        for (const [bar, top] of [[plan, barY], [actual, barY + opt.TIME_BAR_HEIGHT + 3]]) {
          if (bar && x >= bar.x && x <= bar.x + bar.w && y >= top && y <= top + opt.TIME_BAR_HEIGHT) return surgery;
        }
      }
      return null;
    }

    _hitTestTimelineNode(x, y) {
      const width = this.canvas.width / (window.devicePixelRatio || 1);
      if (x < this.options.Y_AXIS_WIDTH || x > width || y < this.options.HEADER_HEIGHT) return null;
      let markers;
      if (this.groupBy === 'patient') {
        // Patient markers are always visible, regardless of surgery selection.
        const row = this._yToRow(y);
        if (this._isSubRow(row)) {
          markers = this._getSubTaskAtRow(row)?._nodeMarkers || [];
        } else {
          markers = (this._getGroupAtRow(row)?.surgeries || [])
            .flatMap(surgery => (surgery._phaseRanges || []).flatMap(phase => phase._nodeMarkers || []));
        }
      } else {
        if (!this.selectedSurgery) return null;
        markers = this._getTimelineNodeMarkers(this.selectedSurgery, width);
      }
      for (const marker of markers) {
        const radius = marker.nodes.length > 1 ? 9 : 6;
        if ((x - marker.x) ** 2 + (y - marker.y) ** 2 <= radius ** 2) {
          return marker.nodes.length > 1 ? {nodes:marker.nodes} : marker.nodes[0];
        }
      }
      return null;
    }

    _hitTestPhaseSubTask(x, y) {
      const opt = this.options;
      if (x < opt.Y_AXIS_WIDTH || y < opt.HEADER_HEIGHT) return null;

      const row = this._yToRow(y);
      if (row < 0) return null;

      // 展开时：检测子任务行上的阶段条
      if (this.expandedGroup && this.subTasks.length && this._isSubRow(row)) {
        const subTask = this._getSubTaskAtRow(row);
        if (!subTask || !subTask.isPhaseSubTask) return null;

        if (subTask.actualStart && subTask.actualEnd && subTask.actualEnd > subTask.actualStart) {
          const barX = this._timeToX(subTask.actualStart);
          const barW = this._timeToX(subTask.actualEnd) - barX;
          const subBarH = 24;
          const rowY = this._rowToY(row);
          const barY = rowY + (opt.SUB_ROW_HEIGHT - subBarH) / 2;

          if (x >= barX && x <= barX + barW && y >= barY && y <= barY + subBarH) {
            // 检查是否悬停在某个里程碑上
            if (subTask.milestones && subTask.milestones.length > 0) {
              for (const milestone of subTask.milestones) {
                if (!milestone.actualTime) continue;
                const mx = this._timeToX(milestone.actualTime);
                const my = barY + subBarH / 2;
                const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
                if (dist <= 6) {
                  return { type: 'milestone', subTask, milestone };
                }
              }
            }
            return { type: 'phase', subTask };
          }
        }
      }

      // 收起时：检测主行上的4大阶段条
      if (!this._isSubRow(row)) {
        const group = this._getGroupAtRow(row);
        if (!group || !group.surgeries) return null;

        // 找到该行对应的手术（ group's surgeries 都映射到同一行）
        const surgery = group.surgeries.find(surgery=>y>=this._patientBarY(surgery)&&y<=this._patientBarY(surgery)+28);
        if (!surgery || !surgery._phaseRanges) return null;

        const phaseBarH = 28;
        const rowY = this._rowToY(row);
        const phaseBarY = this._patientBarY(surgery);

        for (const phase of surgery._phaseRanges) {
          const startX = this._timeToX(phase.startTime);
          const endX = this._timeToX(phase.endTime);
          if (x >= startX && x <= endX && y >= phaseBarY && y <= phaseBarY + phaseBarH) {
            // 检查是否悬停在某个里程碑上
            for (const milestone of phase.milestones) {
              if (!milestone.actualTime) continue;
              const mx = this._timeToX(milestone.actualTime);
              const my = phaseBarY + phaseBarH / 2;
              const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
              if (dist <= 6) {
                return { type: 'milestone', phase, milestone, surgery };
              }
            }
            return { type: 'phase', phase, surgery };
          }
        }
      }

      return null;
    }

    setViewMode(mode) {
      if (mode !== 'day' && mode !== 'week') return;
      this.viewMode = mode;
      this.offsetX = 0;
      this._requestRender();
    }

    setViewDate(date) {
      const parsed = Utils.parseLocalTime(date);
      this.viewDate = parsed || new Date();
      this.viewDate.setHours(0, 0, 0, 0);
      this.offsetX = 0;
      this._requestRender();
    }

    resetView() { this._onDoubleClick(); }

    setScale(scale) {
      this.scale = Utils.clamp(scale, this.options.MIN_ZOOM, this.options.MAX_ZOOM);
      this._emit('viewport', {scale:this.scale});
      this._requestRender();
    }

    getSelected() {
      return this.selectedSurgery;
    }

    selectSurgery(surgeryId) {
      const surgery = this.data.find(s => s.id === surgeryId);
      if (surgery) {
        this.selectedSurgery = surgery;
        this._requestRender();
      }
    }

    clearSelectedTime() {
      this.selectedTime = null;
      this._emit('timeSelect', {time:null});
      this._requestRender();
    }

    deselect() {
      this.selectedSurgery = null;
      this._requestRender();
    }

    scrollToTime(time) {
      const parsed = Utils.parseLocalTime(time, this.viewDate);
      const t = (parsed || new Date(time)).getTime();
      const viewStart = this._getViewStart().getTime();
      const pixelsPerMs = (this.options.PIXELS_PER_HOUR * this.scale) / 3600000;
      const targetX = this.options.Y_AXIS_WIDTH + (t - viewStart) * pixelsPerMs;
      const centerX = (this.canvas.width / (window.devicePixelRatio || 1)) / 2;
      this.offsetX = centerX - targetX;
      this._requestRender();
    }

    scrollToSurgery(surgeryId) {
      const surgery = this.data.find(s => s.id === surgeryId);
      if (surgery) {
        this.scrollToTime(surgery.planStart);
        const row = surgery._rowIndex;
        const rowY = this._rowToY(row);
        const centerY = ((this.canvas.height / (window.devicePixelRatio || 1)) - this.options.HEADER_HEIGHT) / 2;
        this.offsetY = centerY - rowY + this.options.HEADER_HEIGHT;
        this._requestRender();
      }
    }

    toDataURL(type = 'image/png') {
      return this.canvas.toDataURL(type);
    }

    startClock() {
      if (this.clockTimer) return;
      this.clockTimer = setInterval(() => {
        this._requestRender();
      }, 1000);
    }

    stopClock() {
      if (this.clockTimer) {
        clearInterval(this.clockTimer);
        this.clockTimer = null;
      }
    }

    destroy() {
      this._destroyed = true;
      this._cancelExpansion();
      this._listeners.forEach(({target,name,handler,options}) => target.removeEventListener(name,handler,options));
      this._listeners = [];
      if (this.resizeObserver) this.resizeObserver.disconnect();
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      this.stopClock();
      this.canvas.remove();
    }

    _emit(eventName, data) {
      const event = new CustomEvent(`gantt:${eventName}`, { detail: data });
      this.container.dispatchEvent(event);
    }

    on(eventName, handler) {
      this._listen(this.container, `gantt:${eventName}`, handler);
    }

    off(eventName, handler) {
      this.container.removeEventListener(`gantt:${eventName}`, handler);
      this._listeners = this._listeners.filter(item => item.target !== this.container || item.name !== `gantt:${eventName}` || item.handler !== handler);
    }

    resize() {
      this._resize();
    }

    _resize() {
      const rect = this.container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
      this._requestRender();
    }
  }

export default GanttEngine;
