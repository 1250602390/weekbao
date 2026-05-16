const bcrypt = require('bcryptjs')
const User = require('./User')
const Report = require('./Report')
const ReportData = require('./ReportData')
const ReportDraft = require('./ReportDraft')
const OperationLog = require('./OperationLog')
const TemplateConfig = require('./TemplateConfig')

async function initDatabase() {
  // 创建默认用户
  const adminExists = User.findOne({ username: 'admin' })
  if (!adminExists) {
    User.create({
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      display_name: '系统管理员',
      role: 'admin',
      status: 'active'
    })
  }
  const managerExists = User.findOne({ username: 'manager' })
  if (!managerExists) {
    User.create({
      username: 'manager',
      password: bcrypt.hashSync('manager123', 10),
      display_name: '张经理',
      role: 'manager',
      status: 'active'
    })
  }
  const viewerExists = User.findOne({ username: 'viewer' })
  if (!viewerExists) {
    User.create({
      username: 'viewer',
      password: bcrypt.hashSync('viewer123', 10),
      display_name: '李主管',
      role: 'viewer',
      status: 'active'
    })
  }

  // 初始化模板配置
  await initTemplateConfigs()
  console.log('Database initialized successfully')
}

async function initTemplateConfigs() {
  const cnt = TemplateConfig.count()
  if (cnt > 0) return

  const templates = [
    // 路网核实模块
    { module: 'road', field_key: 'road_verified_count', field_label: '新增道路核实条数', field_type: 'number', unit: '条', required: true, sort_order: 1 },
    { module: 'road', field_key: 'road_verified_mileage', field_label: '新增核实里程', field_type: 'number', unit: '公里', required: true, sort_order: 2 },
    { module: 'road', field_key: 'road_change_verified', field_label: '路网变更修改核实条数', field_type: 'number', unit: '条', sort_order: 3 },
    { module: 'road', field_key: 'road_accuracy_rate', field_label: '核实准确率', field_type: 'number', unit: '%', sort_order: 4 },
    { module: 'road', field_key: 'road_pending_count', field_label: '待核实积压量', field_type: 'number', unit: '条', sort_order: 5 },
    { module: 'road', field_key: 'road_feedback_type', field_label: '反馈问题分类', field_type: 'select', options: ['道路缺失', '错误连接', '属性错误', '临时封闭'], sort_order: 6 },
    { module: 'road', field_key: 'road_user_feedback_resolved', field_label: '解决导航用户反馈条数', field_type: 'number', unit: '条', sort_order: 7 },
    { module: 'road', field_key: 'road_nav_errors_avoided', field_label: '估算避免导航错误次数', field_type: 'number', unit: '次', sort_order: 8 },
    { module: 'road', field_key: 'road_key_progress', field_label: '重点项目进展简述', field_type: 'textarea', sort_order: 9 },
    { module: 'road', field_key: 'road_remarks', field_label: '备注说明', field_type: 'textarea', sort_order: 10 },

    // POI数据模块
    { module: 'poi', field_key: 'poi_new_count', field_label: '新增POI数量', field_type: 'number', unit: '个', required: true, sort_order: 1 },
    { module: 'poi', field_key: 'poi_modified_count', field_label: '修改POI数量', field_type: 'number', unit: '个', sort_order: 2 },
    { module: 'poi', field_key: 'poi_deleted_count', field_label: '删除POI数量', field_type: 'number', unit: '个', sort_order: 3 },
    { module: 'poi', field_key: 'poi_phone_verified_rate', field_label: 'POI电话核实率', field_type: 'number', unit: '%', sort_order: 4 },
    { module: 'poi', field_key: 'poi_suspected_cheat', field_label: '疑似作弊POI数量', field_type: 'number', unit: '个', sort_order: 5 },
    { module: 'poi', field_key: 'poi_completeness_score', field_label: '信息完整度得分', field_type: 'number', unit: '分', sort_order: 6 },
    { module: 'poi', field_key: 'poi_search_hit_improve', field_label: '搜索命中率提升百分点', field_type: 'number', unit: 'pp', sort_order: 7 },
    { module: 'poi', field_key: 'poi_brand_coverage', field_label: '重点品牌覆盖贡献', field_type: 'textarea', sort_order: 8 },
    { module: 'poi', field_key: 'poi_remarks', field_label: '备注', field_type: 'textarea', sort_order: 9 },

    // 作弊审核模块
    { module: 'cheat', field_key: 'cheat_audit_total', field_label: '审核总量', field_type: 'number', unit: '条', required: true, sort_order: 1 },
    { module: 'cheat', field_key: 'cheat_auto_audit', field_label: '机器自动审核量', field_type: 'number', unit: '条', sort_order: 2 },
    { module: 'cheat', field_key: 'cheat_manual_audit', field_label: '人工复核量', field_type: 'number', unit: '条', sort_order: 3 },
    { module: 'cheat', field_key: 'cheat_confirmed_count', field_label: '确认作弊数量', field_type: 'number', unit: '条', sort_order: 4 },
    { module: 'cheat', field_key: 'cheat_type', field_label: '作弊类型', field_type: 'select', options: ['虚假门店', '刷评', '恶意篡改', '其他'], sort_order: 5 },
    { module: 'cheat', field_key: 'cheat_avg_time', field_label: '审核平均耗时', field_type: 'text', unit: '分钟/条', sort_order: 6 },
    { module: 'cheat', field_key: 'cheat_new_method', field_label: '新作弊手段简述', field_type: 'textarea', sort_order: 7 },
    { module: 'cheat', field_key: 'cheat_loss_avoided', field_label: '避免损失估算', field_type: 'number', unit: '万元', sort_order: 8 },
    { module: 'cheat', field_key: 'cheat_ai_rate', field_label: 'AI模型自动审核率', field_type: 'number', unit: '%', sort_order: 9 },
    { module: 'cheat', field_key: 'cheat_remarks', field_label: '备注', field_type: 'textarea', sort_order: 10 },

    // 限速信息模块
    { module: 'speed', field_key: 'speed_new_count', field_label: '限速新增数量', field_type: 'number', unit: '处', required: true, sort_order: 1 },
    { module: 'speed', field_key: 'speed_changed_count', field_label: '限速变更数量', field_type: 'number', unit: '处', sort_order: 2 },
    { module: 'speed', field_key: 'speed_matched_count', field_label: '比对一致数量', field_type: 'number', unit: '处', sort_order: 3 },
    { module: 'speed', field_key: 'speed_error_fixed', field_label: '错误修正数量', field_type: 'number', unit: '处', sort_order: 4 },
    { module: 'speed', field_key: 'speed_unprocessed', field_label: '未处理反馈数', field_type: 'number', unit: '条', sort_order: 5 },
    { module: 'speed', field_key: 'speed_overspeed_avoided', field_label: '减少超速误报风险次数', field_type: 'number', unit: '次', sort_order: 6 },
    { module: 'speed', field_key: 'speed_remarks', field_label: '备注', field_type: 'textarea', sort_order: 7 },

    // 电子眼模块
    { module: 'camera', field_key: 'camera_new_count', field_label: '电子眼新增数量', field_type: 'number', unit: '个', required: true, sort_order: 1 },
    { module: 'camera', field_key: 'camera_removed_count', field_label: '拆除/失效核实数量', field_type: 'number', unit: '个', sort_order: 2 },
    { module: 'camera', field_key: 'camera_position_fixed', field_label: '位置纠偏数量', field_type: 'number', unit: '个', sort_order: 3 },
    { module: 'camera', field_key: 'camera_type_fixed', field_label: '类型错误修正数量', field_type: 'number', unit: '个', sort_order: 4 },
    { module: 'camera', field_key: 'camera_speed_inconsistent', field_label: '与限速不一致数量', field_type: 'number', unit: '处', sort_order: 5 },
    { module: 'camera', field_key: 'camera_safety_summary', field_label: '驾驶安全预警帮助评述', field_type: 'textarea', sort_order: 6 },
    { module: 'camera', field_key: 'camera_remarks', field_label: '备注', field_type: 'textarea', sort_order: 7 },

    // 核心价值概要
    { module: 'value', field_key: 'value_user_feedback', field_label: '用户正向反馈摘录', field_type: 'textarea', required: true, sort_order: 1 },
    { module: 'value', field_key: 'value_quality_incident', field_label: '重大数据质量事故/避免案例', field_type: 'textarea', sort_order: 2 },
    { module: 'value', field_key: 'value_competitor_compare', field_label: '与竞品/基线对比突出指标', field_type: 'textarea', sort_order: 3 },

    // 团队总结与下周计划
    { module: 'team', field_key: 'team_efficiency', field_label: '团队人效（总处理条数/投入人天）', field_type: 'text', required: true, sort_order: 1 },
    { module: 'team', field_key: 'team_milestone', field_label: '重大里程碑成果', field_type: 'textarea', sort_order: 2 },
    { module: 'team', field_key: 'team_risk', field_label: '现存风险与问题', field_type: 'textarea', sort_order: 3 },
    { module: 'team', field_key: 'team_next_plan', field_label: '下周重点工作计划', field_type: 'textarea', required: true, sort_order: 4 },
    { module: 'team', field_key: 'team_resource_needed', field_label: '需协调资源', field_type: 'textarea', sort_order: 5 }
  ]

  templates.forEach(t => {
    t.is_active = true
    TemplateConfig.create(t)
  })
}

module.exports = { initDatabase, User, Report, ReportData, ReportDraft, OperationLog, TemplateConfig }
