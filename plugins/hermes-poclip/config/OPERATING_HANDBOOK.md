<!-- META:BEGIN -->
| Trường | Giá trị |
|---|---|
| Phiên bản cẩm nang | 1.0.0 |
| Mốc sinh | 2026-10-12T07:59:08Z |
| Nguồn dữ liệu | DB (cfg_event_topics, cfg_routing_units, cfg_settings, meeting_templates), Role Cards (config/agents/*.json), Taxonomy (config/taxonomy/monitor-tiers.yaml) |
| DB đã dùng | /home/vtanh78/.hermes/poclip.db |
| source_sha256 | 3fd0f61eb20ed69d696c21caf1076d5a66c652a19475e25d98555cb87ef3ccb9 |
| body_sha256 | 205b4717ea4b1e64d646b375d4abeab58e05d0f2d1ed54a12976dd77c042c289 |
| Cách sinh lại | `python3 plugins/hermes-poclip/scripts/generate_handbook.py [--db PATH]` |
| Cách kiểm tra lệch | `python3 plugins/hermes-poclip/scripts/generate_handbook.py --check` |
<!-- META:END -->

> **FILE SINH TỰ ĐỘNG** — KHÔNG SỬA TAY; sửa cấu hình rồi sinh lại. Xem mục 6 để biết lệnh và kiểm tra lệch.

## 1. Luồng liên phòng ban theo event topic

Tổng số topic: 35 | Số đơn vị định tuyến: 16

### tất cả

| Topic | Phòng phát | Phòng nhận | risk_tier | SLA (giây) |
|---|---|---|---|---|
| budget.hard_limit_breached | tất cả | executive, chairman_human | T3 | 1 |
| budget.soft_limit_reached | tất cả | executive | T1 | 60 |
| incident.critical | tất cả | executive, chairman_human | T3 | 60 |
| meeting.convene_requested | tất cả | executive, chairman_human | T1 | — |
| meeting.decision_recorded | tất cả | executive, chairman_human | T1 | — |
| meeting.turn.submitted | tất cả | executive | T1 | — |
| whistleblowing.tip_received | tất cả, external_anonymous | audit, compliance | T1 | — |

### audit

| Topic | Phòng phát | Phòng nhận | risk_tier | SLA (giây) |
|---|---|---|---|---|
| audit.anomaly_critical | audit | executive, chairman_human | T3 | 120 |
| audit.findings | audit | chairman_human | T2 | 300 |
| audit.weekly_spotcheck_flag | audit | chairman_human | T1 | — |

### compliance

| Topic | Phòng phát | Phòng nhận | risk_tier | SLA (giây) |
|---|---|---|---|---|
| compliance.veto | compliance | executive, tất cả | T3 | 10 |

### customer_success

| Topic | Phòng phát | Phòng nhận | risk_tier | SLA (giây) |
|---|---|---|---|---|
| incident.system_bug | customer_success, sales | tech_product | T2 | 1 |

### executive

| Topic | Phòng phát | Phòng nhận | risk_tier | SLA (giây) |
|---|---|---|---|---|
| meeting.closed | executive | tất cả, chairman_human | T1 | — |
| meeting.invitations_sent | executive | tất cả | T1 | — |
| meeting.schedule_triggered | executive | tất cả | T1 | — |
| meeting.turn.started | executive | tất cả | T1 | — |
| org.structural_pattern_detected | executive | chairman_human | T1 | — |
| report.okr_weekly_update | executive | tất cả | T0 | 600 |

### finance

| Topic | Phòng phát | Phòng nhận | risk_tier | SLA (giây) |
|---|---|---|---|---|
| budget.approval_needed | finance | executive | T2 | 300 |
| compliance.anomaly_detected | finance | compliance | T2 | 60 |
| report.financial_periodic | finance, executive | executive | T0 | 600 |

### hr_core

| Topic | Phòng phát | Phòng nhận | risk_tier | SLA (giây) |
|---|---|---|---|---|
| agent.benchmark_passed | hr_core | executive | T1 | — |
| agent.golive_approved | hr_core | executive | T2 | — |
| agent.shadow_mode_cleared | hr_core | executive | T1 | — |
| hr.onboarding_provision | hr_core | tech_product | T1 | 900 |
| hr.role_change | hr_core | tech_product | T1 | 1800 |

### marketing

| Topic | Phòng phát | Phòng nhận | risk_tier | SLA (giây) |
|---|---|---|---|---|
| content.review_requested | marketing, sales | compliance | T1 | 30 |
| lead.nurture_needed | marketing | customer_success | T0 | 30 |
| lead.qualified | marketing | sales | T1 | 5 |

### sales

| Topic | Phòng phát | Phòng nhận | risk_tier | SLA (giây) |
|---|---|---|---|---|
| compliance.legal_consult | sales, marketing | compliance | T1 | 300 |
| customer.tier_upgraded | sales, customer_success | marketing | T0 | 30 |
| order.completed | sales | tech_product, finance | T1 | 120 |

### tech_product

| Topic | Phòng phát | Phòng nhận | risk_tier | SLA (giây) |
|---|---|---|---|---|
| product.release_deployed | tech_product | customer_success, sales | T0 | 300 |

### training

| Topic | Phòng phát | Phòng nhận | risk_tier | SLA (giây) |
|---|---|---|---|---|
| training.plan_ready | training | hr_core, executive | T1 | 900 |
| training.retrain_completed | training | hr_core, executive | T1 | 1800 |

### Định tuyến chỉ đạo

| Đơn vị | Tên hiển thị | Ưu tiên | Từ khoá |
|---|---|---|---|
| audit | Kiểm toán nội bộ | 150 | "\bkiểm toán\b", "\baudit\b", "\bsoát xét\b", "\bđối soát độc lập\b" |
| compliance | Tuân thủ | 140 | "\btuân thủ\b", "\bpháp lý\b", "\bquy định\b", "\bvi phạm\b", "\bchính sách\b" |
| customer_success | Chăm sóc khách hàng | 70 | "\bchăm sóc khách hàng\b", "\bcustomer success\b", "\bkhách hàng\b", "\bhỗ trợ khách\b", "\bhài lòng\b", "\bchurn\b" |
| executive | Điều hành | 100 | "\bgiám đốc\b", "\bceo\b", "\bđiều hành\b", "\bban điều hành\b", "\bc-level\b" |
| finance | Tài chính | 110 | "\bngân sách\b", "\bdòng tiền\b", "\bhóa đơn\b", "\bbudget\b", "\binvoice\b", "\bcashflow\b", "\bchi phí\b" |
| hr_core | Nhân sự | 120 | "\bheadcount\b", "\bcơ cấu tổ chức\b", "\bvòng đời nhân sự\b", "\bonboarding\b", "\bhợp đồng lao động\b" |
| infrastructure_ops | Hạ tầng & Vận hành | 130 | "\bhạ tầng\b", "\binfrastructure\b", "\buptime\b", "\bsự cố hệ thống\b", "\bmáy chủ\b", "\bđộ sẵn sàng\b" |
| ky-thuat | Kỹ thuật | 10 | "\bkỹ thuật\b", "\btech\b", "\bdev\b", "\btechnical\b", "\boauth\b", "\bapi\b", "\bbackend\b", "\bfrontend\b" |
| marketing | Marketing | 30 | "\bmarketing\b", "\btruyền thông\b", "\bcontent\b", "\bquảng cáo\b", "\bchiến dịch\b", "\bcampaign\b", "\bthương hiệu\b", "\bbrand\b", "\bseo\b" |
| nhan-su | Nhân sự | 40 | "\bnhân sự\b", "\bhr\b", "\btuyển dụng\b" |
| qa | QA | 90 | "\bqa\b", "\bkiểm thử\b", "\bchất lượng\b", "\btest case\b", "\bhồi quy\b", "\bkiểm định\b" |
| sales | Kinh doanh | 60 | "\bkinh doanh\b", "\bsales\b", "\bbán hàng\b", "\bđơn hàng\b", "\bdoanh số\b", "\bcrm\b", "\blead\b", "\bchốt đơn\b" |
| tai-chinh | Tài chính | 20 | "\btài chính\b", "\bfinance\b", "\bkế toán\b", "\bq[1-4]\b" |
| tech_product | Kỹ thuật & Sản phẩm | 80 | "\bsản phẩm\b", "\bproduct\b", "\btính năng\b", "\bfeature\b", "\brelease\b", "\bdeploy\b", "\bđặc tả\b", "\broadmap\b" |
| training | Đào tạo | 160 | "\bđào tạo\b", "\btraining\b", "\bkỹ năng\b", "\bhuấn luyện\b", "\bbồi dưỡng\b" |
| van-hanh | Vận hành | 50 | "\bvận hành\b", "\bops\b", "\boperation\b" |

## 2. Tuyến chỉ đạo và tuyến báo cáo

| Agent | Vai trò | Cluster | Báo cáo cho | Giai đoạn | Quyền hạn | Quy tắc escalation |
|---|---|---|---|---|---|---|
| audit-agent | independent_control | audit | chairman_human | independent_operation | auto_approve_max_vnd=0; forbidden_actions=[modify_constitution.yaml, write_or_delete_any_table_except_audit_log_correction, report_through_ceo_agent, share_separate_infrastructure_or_api_key_with_ceo_agent]; requires_human_approval_above_vnd=0 | financial_discrepancy_over_5pct_detected→alert_chairman_direct_telegram_bypass_ceo; ceo_agent_manipulation_pattern_suspected→freeze_ceo_agent_write_scope_and_alert; weekly_spotcheck_mismatch_found→flag_report_do_not_block_send |
| ceo-agent | orchestrator | executive | chairman_human | independent_operation | auto_approve_max_vnd=5000000; forbidden_actions=[modify_constitution.yaml, add_or_remove_lead_agent_without_chairman_approval, approve_spending_above_hard_limit, deploy_to_production_without_hitl, self_approve_own_risk_tier_t2_or_t3_proposal]; requires_human_approval_above_vnd=50000000 | cost_exceeds_hard_limit→trigger_circuit_breaker_and_notify; unresolved_conflict_between_two_lead_agents_timeout→escalate_with_two_options_summary_via_comm_center; business_decision_conflicts_with_core_values→refuse_and_report |
| compliance-agent | independent_control | compliance | chairman_human | independent_operation | auto_approve_max_vnd=0; forbidden_actions=[modify_constitution.yaml, approve_own_veto_override, act_as_sole_approver_for_risk_tier_t3]; requires_human_approval_above_vnd=0 | veto_issued_against_ceo_agent→notify_chairman_immediately_with_full_context; whistleblowing_tip_volume_spike_suspected_dos→queue_low_priority_require_corroboration |
| customer_success-agent-2 | worker | customer_success | customer_success-lead-agent | design | auto_approve_max_vnd=500000; forbidden_actions=[issue_refund_without_lead_approval, promise_delivery_date_or_sla_outside_approved_playbook]; requires_human_approval_above_vnd=5000000 | ticket_requires_decision_beyond_own_authority→assign_to_lead_with_full_context; vip_customer_churn_risk_detected→notify_lead_and_prepare_save_plan; suspected_data_privacy_breach_or_legal_complaint→stop_and_escalate_immediately |
| customer_success-lead-agent | lead | customer_success | ceo-agent | independent_operation | auto_approve_max_vnd=5000000; forbidden_actions=[issue_refund_above_delegation_matrix_threshold_without_approval, commit_sla_or_delivery_date_to_customer_without_ceo_approval]; requires_human_approval_above_vnd=50000000 | high_severity_complaint_or_ticket_breaches_sla→escalate_with_root_cause_summary; customer_data_privacy_breach_suspected→stop_handling_and_report_immediately; confirmed_system_bug_affecting_multiple_customers→open_incident_and_request_fix; task_scope_overlap_detected_same_cluster→reject_and_propose_merge |
| finance-lead-agent | lead | finance | ceo-agent | independent_operation | auto_approve_max_vnd=5000000; forbidden_actions=[beautify_or_alter_reported_figures, approve_own_anomaly_finding]; requires_human_approval_above_vnd=50000000 | financial_anomaly_detected→auto_freeze_transaction_and_notify_compliance; task_scope_overlap_detected_same_cluster→reject_and_propose_merge |
| hr-lead-agent | lead | hr_core | ceo-agent | independent_operation | auto_approve_max_vnd=0; forbidden_actions=[move_agent_to_independent_operation_without_valid_benchmark_and_shadow_mode_record, skip_shadow_mode_evidence_requirements]; requires_human_approval_above_vnd=0 | role_card_fails_schema_validation→reject_and_report; shadow_mode_error_rate_exceeds_threshold→extend_shadow_mode_and_notify |
| marketing-agent-2 | worker | marketing | marketing-lead-agent | design | auto_approve_max_vnd=500000; forbidden_actions=[publish_content_without_compliance_review_if_flagged, spend_ad_budget_directly_from_own_account]; requires_human_approval_above_vnd=5000000 | content_claim_requires_legal_or_compliance_check→hold_publish_and_request_review; campaign_budget_or_scope_beyond_own_authority→request_lead_approval_before_commit; brand_crisis_or_public_complaint_about_content→stop_publishing_and_escalate |
| marketing-lead-agent | lead | marketing | ceo-agent | independent_operation | auto_approve_max_vnd=5000000; forbidden_actions=[publish_content_without_compliance_review_if_flagged, exceed_hard_limit_ad_spend]; requires_human_approval_above_vnd=50000000 | budget_hard_limit_reached→pause_campaigns_and_notify; task_scope_overlap_detected_same_cluster→reject_and_propose_merge |
| ops-agent | independent_control | infrastructure_ops | chairman_human | independent_operation | auto_approve_max_vnd=0; forbidden_actions=[modify_constitution.yaml, write_or_delete_any_table, report_through_ceo_agent, share_separate_infrastructure_or_api_key_with_ceo_agent]; requires_human_approval_above_vnd=0 | dispatcher_chet_or_critical_infra_failure_found→alert_chairman_direct_telegram_bypass_ceo; ceo_agent_infrastructure_itself_appears_affected→alert_chairman_direct_independent_of_ceo |
| qa-agent-2 | worker | qa | qa-lead-agent | design | auto_approve_max_vnd=500000; forbidden_actions=[sign_off_release_that_self_tested, modify_source_code_or_production_data_of_product_under_test]; requires_human_approval_above_vnd=5000000 | critical_test_fails_on_release_candidate→stop_and_report_with_evidence; test_environment_missing_or_blocked→request_infrastructure_support; production_data_exposed_during_test→stop_test_and_escalate |
| qa-lead-agent | lead | qa | ceo-agent | design | auto_approve_max_vnd=5000000; forbidden_actions=[sign_off_release_while_critical_test_fails, edit_source_code_of_the_product_under_test]; requires_human_approval_above_vnd=50000000 | critical_defect_blocks_release→hold_quality_gate_and_notify; repeated_defect_pattern_suggests_process_gap→escalate_findings_with_evidence; release_signoff_withheld_beyond_sla→convene_decision_meeting |
| sales-agent-2 | worker | sales | sales-lead-agent | design | auto_approve_max_vnd=500000; forbidden_actions=[offer_discount_outside_approved_price_book, commit_legal_terms_or_sla_without_approval]; requires_human_approval_above_vnd=5000000 | quote_or_discount_beyond_approved_price_book→request_lead_approval_before_sending; deal_value_above_own_authority_threshold→request_ceo_approval; customer_requests_unapproved_legal_terms→stop_and_escalate |
| sales-lead-agent | lead | sales | ceo-agent | independent_operation | auto_approve_max_vnd=5000000; forbidden_actions=[offer_discount_above_delegation_matrix_threshold_without_approval]; requires_human_approval_above_vnd=50000000 | high_value_complaint_received→escalate_to_ceo_and_compliance; task_scope_overlap_detected_same_cluster→reject_and_propose_merge |
| tech_product-agent-2 | worker | tech_product | tech_product-lead-agent | design | auto_approve_max_vnd=500000; forbidden_actions=[change_release_scope_without_lead_approval, commit_deadline_to_customer_without_lead_approval]; requires_human_approval_above_vnd=5000000 | sprint_scope_change_or_blocked_task→request_lead_decision; timeline_slip_risk_detected→raise_risk_with_recovery_options; cross_department_dependency_stalls_delivery→escalate_with_impact_analysis |
| tech_product-agent-3 | worker | tech_product | tech_product-lead-agent | design | auto_approve_max_vnd=500000; forbidden_actions=[approve_requirement_change_without_lead_signoff, use_real_customer_data_outside_approved_scope]; requires_human_approval_above_vnd=5000000 | requirement_conflict_between_departments→request_lead_facilitation; ambiguous_or_missing_business_input→raise_clarification_request; requirement_touches_legal_or_compliance_constraint→escalate_for_review |
| tech_product-agent-4 | worker | tech_product | tech_product-lead-agent | design | auto_approve_max_vnd=500000; forbidden_actions=[push_directly_to_protected_branch_without_review, deploy_to_production_without_approval]; requires_human_approval_above_vnd=5000000 | cannot_meet_sla_or_design_constraint→request_lead_decision_with_tradeoffs; change_requires_schema_or_data_migration→request_lead_and_human_approval; production_incident_or_data_loss_detected→stop_and_escalate_immediately |
| tech_product-agent-5 | worker | tech_product | tech_product-lead-agent | design | auto_approve_max_vnd=500000; forbidden_actions=[push_directly_to_protected_branch_without_review, change_public_ui_scope_without_lead_approval]; requires_human_approval_above_vnd=5000000 | design_spec_ambiguous_or_conflicts_with_technical_limit→request_lead_decision; ui_issue_affects_paying_customers→notify_lead_and_prepare_hotfix_plan; ui_leaks_customer_data_or_breaks_access_control→stop_and_escalate_immediately |
| tech_product-lead-agent | lead | tech_product | ceo-agent | independent_operation | auto_approve_max_vnd=5000000; forbidden_actions=[deploy_to_production_without_hitl]; requires_human_approval_above_vnd=50000000 | production_incident_critical→activate_incident_response_and_notify; deploy_requires_production_access→request_human_approval; infra_cost_beyond_budget_threshold→request_budget_approval; critical_system_bug_reported→create_incident_and_notify; task_scope_overlap_detected_same_cluster→reject_and_propose_merge |
| training-lead-agent | lead | training | ceo-agent | independent_operation | auto_approve_max_vnd=0; forbidden_actions=[modify_role_card_of_agent_being_trained_directly, extend_shadow_mode_without_hr_lead_agent_involvement]; requires_human_approval_above_vnd=0 | training_plan_does_not_improve_kpi_after_2_cycles→escalate_role_card_or_task_scope_review |

### Chuỗi báo cáo

- audit-agent → chairman_human
- ceo-agent → chairman_human
- compliance-agent → chairman_human
- customer_success-agent-2 → customer_success-lead-agent → ceo-agent → chairman_human
- customer_success-lead-agent → ceo-agent → chairman_human
- finance-lead-agent → ceo-agent → chairman_human
- hr-lead-agent → ceo-agent → chairman_human
- marketing-agent-2 → marketing-lead-agent → ceo-agent → chairman_human
- marketing-lead-agent → ceo-agent → chairman_human
- ops-agent → chairman_human
- qa-agent-2 → qa-lead-agent → ceo-agent → chairman_human
- qa-lead-agent → ceo-agent → chairman_human
- sales-agent-2 → sales-lead-agent → ceo-agent → chairman_human
- sales-lead-agent → ceo-agent → chairman_human
- tech_product-agent-2 → tech_product-lead-agent → ceo-agent → chairman_human
- tech_product-agent-3 → tech_product-lead-agent → ceo-agent → chairman_human
- tech_product-agent-4 → tech_product-lead-agent → ceo-agent → chairman_human
- tech_product-agent-5 → tech_product-lead-agent → ceo-agent → chairman_human
- tech_product-lead-agent → ceo-agent → chairman_human
- training-lead-agent → ceo-agent → chairman_human

## 3. Lịch và nhịp họp

| Loại | Tên mẫu họp | Thời lượng mặc định (phút) | Chế độ phát biểu | Số vòng thảo luận | Thời lượng tối đa (phút) | Dừng sớm khi | Nhịp (cron) | Quorum |
|---|---|---|---|---|---|---|---|---|
| incident | Họp khẩn cấp (Incident Response) | 20 | round_robin | 1 | 30 | chairman | — | count 2.0 |
| project | Họp dự án (Project Review) | 45 | hybrid | 2 | 60 | chairman | — | count 3.0 |
| recurring | Họp thường kỳ (Recurring) | 30 | round_robin | 2 | 45 | none | — | percentage 51.0 |
| retrospective | Họp tổng kết và Rút kinh nghiệm (Retrospective) | 45 | round_robin | 2 | 60 | chairman | — | count 3.0 |
| standup | Họp giao ban (Stand-up) | 15 | round_robin | 1 | 20 | none | 0 9 * * 1-5 | percentage 51.0 |
| strategy | Họp chiến lược (Strategy Session) | 30 | hybrid | 2 | 30 | consensus | — | percentage 75.0 |

## 4. Nhịp digest và ngưỡng escalation

| Nhịp | Cron | Múi giờ | Kênh | Lưu trữ (ngày) |
|---|---|---|---|---|
| daily | 0 8 * * * | Asia/Ho_Chi_Minh | telegram, dashboard | — |
| weekly | 0 9 * * 1 | Asia/Ho_Chi_Minh | telegram, dashboard | — |

**Ngưỡng escalation review:**

| Loại | Nhắc nhở (giờ) | Escalate (giờ) |
|---|---|---|
| review | 24 | 72 |

**SLA chỉ đạo theo risk_tier:**

| risk_tier | Cảnh báo 1 (giờ) | Cảnh báo 2 (giờ) | Escalate (giờ) |
|---|---|---|---|
| T1 | 4.0 | 8.0 | 12.0 |
| T2 | 2.0 | 4.0 | 6.0 |
| T3 | 1.0 | — | 2.0 |

## 5. Danh mục điểm giám sát và nơi xử lý

_Nguồn dữ liệu mục này: taxonomy tĩnh `config/taxonomy/monitor-tiers.yaml` (không nằm trong bảng cfg_\* của DB)._

- **T1_HE_THONG** (T1 — Hệ thống): 11 điểm giám sát
- **T2_VAN_HANH** (T2 — Vận hành): 11 điểm giám sát
- **T3_NGHIEP_VU** (T3 — Nghiệp vụ): 11 điểm giám sát

| Điểm giám sát (incident_class) | Tên | Tầng | Vai trò xử lý (owning_role) | Hành động trong phạm vi | Kênh escalation | Tiền tố task | SLA (giờ) | Nguồn tham chiếu |
|---|---|---|---|---|---|---|---|---|
| agent_du_phong_han_muc | Nhân sự AI chuyển model dự phòng do hạn mức | T1_HE_THONG | vp-giam-sat | Kiểm tra quota nhà cung cấp, xác nhận dự phòng đã hoạt động, ghi ops.db | board_kiem_soat | [CANH BAO] | 0.5 | monitoring/fallback_watchdog.py |
| ban_va | Ban vá (patch emergency) | T1_HE_THONG | ht-truong-phong | Áp dụng hotfix theo quy trình khẩn, kiểm tra regression, ghi ops.db (Phần 1 T1 mục 2) | board_kiem_soat | [SU CO] | 1.0 | Phần 1 T1 mục 2 |
| cap_phat_ket | Tác vụ cấp phát agent bị kẹt | T1_HE_THONG | ht-truong-phong | Kiểm tra provisioning queue, retry/cancel job kẹt, ghi ops.db | board_kiem_soat | [CANH BAO] | 0.5 | scan_findings.py:108 |
| chi_phi_ha_tang | Chi phí hạ tầng vượt ngưỡng | T3_NGHIEP_VU | vp-giam-doc | Đánh giá chi phí, ghi biên bản, leo thang Chủ tịch nếu vượt 1tr/lần hoặc 3tr/tháng (Phần 1 T3 mục 7 + 5.2.1) | dm_575801989 | [BAO CAO] | 2.0 | Phần 1 T3 mục 7 + 5.2.1 |
| cron_db_loi | Cron/DB lỗi | T1_HE_THONG | ht-truong-phong | Kiểm tra cron log, kiểm tra DB integrity, retry/reschedule nếu trong thẩm quyền, ghi ops.db (doc 2.3) | board_kiem_soat | [SU CO] | 1.0 | 2.3 |
| de_xuat_chot_done | Đề xuất chốt done | T3_NGHIEP_VU | vp-giam-doc | Xem xét tiêu chí done, xác nhận hoặc trả lại, ghi quyết định (doc 2.11) | board_kiem_soat | [DE XUAT] | 2.0 | 2.11 |
| dispatcher_chet | Dispatcher chết / không spawn | T1_HE_THONG | ht-truong-phong | Kiểm tra gateway dispatch_in_gateway (phải true), restart gateway/process dispatcher, verify task ready được spawn, ghi ops.db (doc 2.14) | board_kiem_soat | [SU CO] | 0.5 | 2.14 |
| duyet_done | Duyệt done | T3_NGHIEP_VU | vp-giam-doc | Xem xét kết quả done, phê duyệt hoặc reject, ghi quyết định (Phần 1 T3 mục 1) | board_kiem_soat | [DUYET] | 2.0 | Phần 1 T3 mục 1 |
| errors_log_moi | Errors log mới | T1_HE_THONG | ht-truong-phong | Phân tích stack trace, xác định root cause, patch/rollback nếu trong thẩm quyền, ghi ops.db (doc 2.2) | board_kiem_soat | [SU CO] | 1.0 | 2.2 |
| event_delivery | Event delivery (a2a pending/stuck/DLQ/SLA breach) | T2_VAN_HANH | vp-giam-sat | Kiểm tra event bus queue, retry/DLQ handling, xác nhận delivery, ghi ops.db (repo-specific) | board_kiem_soat | [SU CO] | 2.0 | repo-specific (a2a pending/stuck/DLQ/SLA breach) |
| gateway_dung | Gateway dừng | T2_VAN_HANH | vp-giam-sat | Restart gateway, kiểm tra upstream, verify routing, ghi ops.db (doc 2.8) | board_kiem_soat | [SU CO] | 0.5 | 2.8 |
| gd_khong_xu_ly_48h | GD không xử lý 48h (Ban KS leo thang) | T3_NGHIEP_VU | ban-kiem-soat | Leo thang Ban Kiểm soát sau 48h GD không xử lý, ghi biên bản, thông báo Chủ tịch (Phần 1 T3 mục 9) | dm_575801989 | [BAO CAO] | 48.0 | Phần 1 T3 mục 9 |
| kien_truc_lon | Kiến trúc lớn (luôn đẩy Chủ tịch) | T3_NGHIEP_VU | vp-giam-doc | Trình bày kiến trúc, thu thập phản hồi Chủ tịch, ghi biên bản quyết định (Phần 1 T3 mục 8) | dm_575801989 | [BAO CAO] | 24.0 | Phần 1 T3 mục 8 |
| logic_nghiep_vu_sai | Logic nghiệp vụ sai | T3_NGHIEP_VU | vp-giam-doc | Phân tích logic sai, đề xuất correction, ghi quyết định GD (Phần 1 T3 mục 6) | board_kiem_soat | [BAO CAO] | 2.0 | Phần 1 T3 mục 6 |
| meeting_agent_timeout | Meeting agent/session timeout | T1_HE_THONG | ht-truong-phong | Phát hiện timeout agent/session, ghi log, thông báo session controller (repo-specific watchdog) | board_kiem_soat | [CANH BAO] | 0.5 | repo-specific (watchdog agent/session timeout) |
| phien_hop_ket | Phiên họp bị kẹt | T2_VAN_HANH | vp-giam-sat | Kiểm tra trạng thái phiên họp, ping session controller, đóng phiên kẹt, ghi ops.db | board_kiem_soat | [CANH BAO] | 1.0 | scan_findings.py:90 |
| plugin_loi | Plugin lỗi | T1_HE_THONG | ht-truong-phong | Tắt plugin lỗi, fallback graceful, thông báo owner, ghi ops.db (Phần 1 T1 mục 3) | board_kiem_soat | [SU CO] | 1.0 | Phần 1 T1 mục 3 |
| quyet_dinh_nghiep_vu | Quyết định nghiệp vụ | T3_NGHIEP_VU | vp-giam-doc | Thu thập thông tin, phân tích, ra quyết định nghiệp vụ, ghi comm_log (doc 2.12) | board_kiem_soat | [BAO CAO] | 2.0 | 2.12 |
| service_process_chet | Service/process chết | T1_HE_THONG | ht-truong-phong | Restart service đúng unit systemd --user, kiểm tra cgroup, verify trạng thái, ghi ops.db (doc 2.1) | board_kiem_soat | [SU CO] | 0.5 | 2.1 |
| su_co_milestone | Sự cố milestone | T3_NGHIEP_VU | vp-giam-doc | Đánh giá tác động milestone, điều chỉnh kế hoạch, báo cáo GD (Phần 1 T3 mục 5) | board_kiem_soat | [SU CO] | 1.0 | Phần 1 T3 mục 5 |
| tai_nguyen | Tài nguyên (CPU/RAM/disk) | T1_HE_THONG | ht-truong-phong | Thu thập metrics tài nguyên, cảnh báo nếu vượt ngưỡng, báo cáo trend (Phần 1 T1 mục 6) | board_kiem_soat | [BAO CAO] | 1.0 | Phần 1 T1 mục 6 |
| task_blocked_lan_dau | Task bị block lần đầu | T2_VAN_HANH | vp-giam-sat | Xác định blocker, liên hệ owner task liên quan, cập nhật trạng thái kanban, ghi comm_log (doc 2.4) | board_kiem_soat | [CANH BAO] | 0.5 | 2.4 |
| task_blocked_loop | Task blocked vòng lặp (đẩy GD) | T2_VAN_HANH | vp-giam-sat | Phân tích vòng lặp block, đề xuất giải pháp, leo thang GD nếu vượt thẩm quyền, ghi ops.db (doc 2.5) | board_kiem_soat | [SU CO] | 2.0 | 2.5 |
| task_cho_reset | Task chờ reset | T2_VAN_HANH | vp-giam-sat | Xác nhận cần reset, thực hiện reset theo quy trình, ghi audit trail (doc 2.6) | board_kiem_soat | [CANH BAO] | 0.5 | 2.6 |
| task_ket_heartbeat | Task kẹt heartbeat | T2_VAN_HANH | vp-giam-sat | Kiểm tra heartbeat signal, ping agent, timeout/kill nếu cần, ghi ops.db (doc 2.7) | board_kiem_soat | [CANH BAO] | 0.5 | 2.7 |
| task_ready_ket | Task READY kẹt không được xử lý | T2_VAN_HANH | vp-giam-sat | Kiểm tra dispatcher/concurrency cap, liên hệ Trưởng phòng sở hữu, thực hiện dispatch lại hoặc phân công lại, ghi comm_log (doc 2.13) | board_kiem_soat | [CANH BAO] | 1.0 | 2.13 |
| todo_triage_ket | Todo/triage kẹt | T2_VAN_HANH | vp-giam-sat | Rà soát todo queue, triage items kẹt, escalate nếu cần (doc 2.4/2.7 phụ) | board_kiem_soat | [CANH BAO] | 0.5 | doc 2.4/2.7 phụ |
| ton_dong_task | Tồn đọng task | T2_VAN_HANH | vp-giam-sat | Đánh giá tồn đọng, nhắc hạn owner, đề xuất phân công lại (doc 2.10) | board_kiem_soat | [NHAC HAN] | 1.0 | 2.10 |
| tool_health | Tool health check | T1_HE_THONG | ht-truong-phong | Ping công cụ, kiểm tra response, fallback nếu tool down, ghi ops.db (Phần 1 T1 mục 7) | board_kiem_soat | [CANH BAO] | 1.0 | Phần 1 T1 mục 7 |
| trat_tu_task | Trật tự task | T2_VAN_HANH | vp-giam-sat | Rà soát thứ tự ưu tiên, reorder nếu cần, báo cáo tình trạng (doc 2.9) | board_kiem_soat | [BAO CAO] | 1.0 | 2.9 |
| vi_pham_quy_trinh | Vi phạm quy trình | T3_NGHIEP_VU | vp-giam-doc | Xác định vi phạm, ghi biên bản, đề xuất xử lý, báo cáo GD (Phần 1 T3 mục 4) | board_kiem_soat | [BAO CAO] | 2.0 | Phần 1 T3 mục 4 |
| waiting_review_sla | Waiting review SLA | T3_NGHIEP_VU | vp-giam-doc | Nhắc nhở reviewer, ghi lịch sử, leo thang nếu SLA breach (doc 2.11 — bản chất T3 dù file ở comm/) | board_kiem_soat | [NHAC HAN] | 2.0 | doc 2.11 |
| worker_blocked_root_cause | Worker blocked — phân tích root cause | T3_NGHIEP_VU | vp-giam-doc | Phân tích root cause worker blocked, đề xuất giải pháp cấp độ nghiệp vụ (Phần 1 T3 mục 3) | board_kiem_soat | [SU CO] | 2.0 | Phần 1 T3 mục 3 |

## 6. Chống lệch: mốc sinh và hash

Hai hash bảo vệ tài liệu khỏi lệch lạc:

- **source_sha256**: hash JSON chuẩn hoá của toàn bộ dữ liệu nguồn (DB cfg_* + meeting_templates + Role Cards + taxonomy monitor-tiers.yaml). Đổi khi cấu hình DB thay đổi.
- **body_sha256**: hash phần thân tài liệu (từ `## 1.` tới hết file). Đổi nếu ai sửa tay file.

> **CẢNH BÁO**: Không sửa tay file này. Thay đổi cấu hình → sinh lại.

**Lệnh sinh lại:**
```bash
python3 plugins/hermes-poclip/scripts/generate_handbook.py [--db /path/to/db]
```

**Lệnh kiểm tra lệch:**
```bash
python3 plugins/hermes-poclip/scripts/generate_handbook.py --check
```

**Tổng hợp số lượng nguồn:**

| Nguồn | Số lượng |
|---|---|
| Event topics | 35 |
| Routing units | 16 |
| Role cards | 20 |
| Mẫu họp | 6 |
| Monitor layers | 3 |
| Điểm giám sát | 33 |
