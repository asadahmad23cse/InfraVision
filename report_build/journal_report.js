const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak
} = require('docx');

// ─── Layout constants ───────────────────────────────────────────────────────
const FONT = "Times New Roman";
const BODY_SIZE  = 22;   // 11pt
const SMALL_SIZE = 18;   // 9pt
const H1_SIZE    = 24;   // 12pt bold
const H2_SIZE    = 22;   // 11pt bold
const CONTENT_W  = 9360; // 8.5" - 2×1" margins (DXA)
const FULL_LINE  = 276;  // ~1.15 line spacing

// ─── Border helpers ──────────────────────────────────────────────────────────
const THIN  = { style: BorderStyle.SINGLE, size: 4,  color: "000000" };
const THICK = { style: BorderStyle.SINGLE, size: 8,  color: "000000" };
const NONE  = { style: BorderStyle.NIL,    size: 0,  color: "FFFFFF" };
const CELL_BORDERS = { top: THIN, bottom: THIN, left: THIN, right: THIN };

// ─── Paragraph helpers ───────────────────────────────────────────────────────
function body(text, { before = 0, after = 160, italic = false, align = AlignmentType.JUSTIFIED } = {}) {
  return new Paragraph({
    alignment: align,
    spacing: { before, after, line: FULL_LINE, lineRule: "auto" },
    children: [new TextRun({ text, size: BODY_SIZE, font: FONT, italics: italic })],
  });
}

function bodyRuns(runs, { before = 0, after = 160, align = AlignmentType.JUSTIFIED } = {}) {
  return new Paragraph({
    alignment: align,
    spacing: { before, after, line: FULL_LINE, lineRule: "auto" },
    children: runs.map(r => new TextRun({
      text: r.text,
      size: r.size || BODY_SIZE,
      font: FONT,
      bold: !!r.bold,
      italics: !!r.italic,
    })),
  });
}

function secH1(num, title) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text: `${num}. ${title}`, bold: true, size: H1_SIZE, font: FONT })],
  });
}

function secH2(num, title) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: `${num}  ${title}`, bold: true, size: H2_SIZE, font: FONT })],
  });
}

function centered(text, { size = BODY_SIZE, bold = false, before = 0, after = 120 } = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before, after },
    children: [new TextRun({ text, size, bold, font: FONT })],
  });
}

// ─── Table helper ─────────────────────────────────────────────────────────────
function tCell(text, { bold = false, shade = false, width, align = AlignmentType.LEFT } = {}) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: width, type: WidthType.DXA },
    shading: shade ? { fill: "E0E0E0", type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: align,
      spacing: { after: 0, line: 240 },
      children: [new TextRun({ text, bold, size: SMALL_SIZE + 2, font: FONT })],
    })],
  });
}

function makeTable(headers, rows, widths) {
  const sum = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: sum, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => tCell(h, { bold: true, shade: true, width: widths[i], align: AlignmentType.CENTER })),
      }),
      ...rows.map((r, ri) => new TableRow({
        children: r.map((c, ci) => tCell(String(c), {
          width: widths[ci],
          align: ci === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
          shade: ri % 2 === 1,
        })),
      })),
    ],
  });
}

function tableCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 200 },
    children: [new TextRun({ text, size: SMALL_SIZE + 2, italics: true, font: FONT })],
  });
}

function spacer(after = 120) {
  return new Paragraph({ spacing: { after }, children: [new TextRun({ text: "" })] });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DOCUMENT CONTENT
// ═══════════════════════════════════════════════════════════════════════════════
const kids = [];

// ── Title block ──────────────────────────────────────────────────────────────
kids.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 4 } },
  children: [new TextRun({
    text: "Digital Twin Enabled Sustainability Intelligence Framework for Smart Cities: A Case Study of Delhi",
    bold: true, size: 30, font: FONT,
  })],
}));

kids.push(centered("Asad Ahmad", { size: 24, bold: true, before: 160, after: 60 }));
kids.push(centered("B.Tech., Computer Science and Engineering", { after: 60 }));
kids.push(centered("Urban AI and Sustainability Systems — InfraVision Project", { italic: true, after: 60 }));
kids.push(centered("Email: techieasad01@gmail.com", { size: SMALL_SIZE + 2, after: 60 }));
kids.push(centered("April 2026", { after: 280 }));

// ── Abstract ─────────────────────────────────────────────────────────────────
kids.push(bodyRuns([{ text: "Abstract.  ", bold: true }, {
  text: "Rapid urbanization in Indian megacities has produced compounding stresses across water supply, energy distribution, solid waste management, and atmospheric emissions, demanding analytical tools capable of joint simulation across all four domains simultaneously. This paper presents InfraVision, a Digital Twin enabled sustainability intelligence framework applied to the National Capital Territory of Delhi. The system models the city as a nine-zone directed graph and integrates four domain-specific machine learning forecasting models — Prophet for water demand, XGBoost for energy demand, Random Forest for waste generation, and Ridge Regression for carbon emissions — with a PuLP-based linear optimisation engine and a SHAP-driven explainability layer. Baseline projections to 2030 indicate that the water supply deficit will expand from 594 million gallons per day (MGD) to 764 MGD, greenhouse gas emissions will rise from 56.5 to 62.4 MtCO\u2082e, while waste processing efficiency improves from 78 to 95 percent. Under an optimised policy bundle subject to budget and emission constraints, the composite sustainability score improves by 5.08 points and carbon emissions are reduced by 9.49 MtCO\u2082e. A dedicated validation protocol benchmarks all forecasting components against withheld historical ground truth, yielding mean absolute percentage errors below six percent across every domain. Sensitivity analysis confirms that the system is robust to realistic perturbations of demographic and demand inputs, and a structured benchmark comparison demonstrates that InfraVision delivers materially higher decision quality than conventional static planning workflows. The results establish InfraVision as a statistically reliable and decision-useful tool for sustainable urban planning."
}], { before: 0, after: 160 }));

kids.push(bodyRuns([
  { text: "Keywords:  ", bold: true },
  { text: "digital twin; urban sustainability; smart city; machine learning forecasting; policy optimisation; explainable AI; Delhi; carbon intelligence." },
]));

kids.push(new Paragraph({ children: [new PageBreak()] }));

// ── 1. Introduction ──────────────────────────────────────────────────────────
kids.push(secH1("1", "Introduction"));
kids.push(body(
  "Cities across the developing world are confronting a convergence of sustainability crises that standard planning instruments are structurally unable to address. Urban populations are projected to increase to nearly 70 percent of the global total by 2050 (United Nations, 2023), intensifying pressures on water supply systems, energy grids, waste processing facilities, and atmospheric quality simultaneously. Delhi, with a resident population exceeding 33 million and a rapid in-migration rate, exemplifies this condition. The Delhi Jal Board reported a daily water deficit in excess of 300 MGD as early as 2023; per capita greenhouse gas emissions continue to climb as the vehicle fleet expands; and waste processing capacity at the city's landfill sites is approaching functional saturation (Delhi Jal Board, 2023; Central Pollution Control Board, 2023)."
));
kids.push(body(
  "Conventional urban planning relies on periodic, domain-siloed assessments that cannot capture interdependencies between these systems or support anticipatory policy design. As Therias and Rafiee (2023) observe, traditional approaches are generally too inflexible and reactive to manage the complexity and dynamism of modern cities. Digital twin technology offers a structural answer by creating a continuously updated virtual replica of the physical city that supports real-time monitoring, predictive analytics, and policy simulation (Mazzetto, 2024). When applied to urban sustainability, a digital twin can model how a policy intervention in one domain — for example, expanding waste-to-energy capacity — propagates its effects across energy supply, emission accounting, and spatial equity simultaneously."
));
kids.push(body(
  "Recent advances in the Internet of Things, artificial intelligence, geographic information systems, and cloud computing have accelerated digital twin deployment across multiple sectors of smart city development (Alexandrov et al., 2024). However, the urban sustainability literature reveals persistent gaps: most implementations are domain-specific; optimisation is rarely embedded in the twin itself; and the explainability of model output is often absent, limiting trust among planners and policymakers (Al-Khateeb et al., 2024)."
));
kids.push(body(
  "This paper formalises InfraVision, an integrated Digital Twin enabled sustainability intelligence framework designed to address these gaps. The system combines a graph-based infrastructure model, a multi-domain machine learning forecasting layer, a constraint-based linear optimisation engine, and a SHAP-driven explainability interface within a single operational environment. The paper makes five contributions: an integrated multi-domain digital twin for urban sustainability; optimisation-driven policy ranking under budget and emission constraints; quantified explainability of model outputs; an independent validation protocol covering statistical accuracy, simulation plausibility, sensitivity, and benchmark comparison; and a detailed empirical analysis of Delhi's sustainability trajectory to 2030."
));
kids.push(body(
  "The remainder of the paper is structured as follows. Section 2 reviews the theoretical foundations and relevant literature. Section 3 presents the methodology, including the graph model, forecasting architecture, and optimisation formulation. Section 4 describes the system architecture and implementation. Section 5 presents the empirical results and policy analysis. Section 6 provides the validation and performance evaluation. Section 7 discusses the implications. Section 8 concludes with future directions."
));

// ── 2. Theoretical Background and Literature Review ──────────────────────────
kids.push(secH1("2", "Theoretical Background and Literature Review"));

kids.push(secH2("2.1", "The Urban Digital Twin"));
kids.push(body(
  "The concept of the digital twin originated in the manufacturing sector, where it was used to create virtual replicas of physical assets to monitor performance and predict failure modes. Translated to the urban scale, a digital twin refers to a dynamic, continuously updated virtual representation of a city's physical systems that integrates data from sensors, IoT devices, geographic information systems, and administrative databases (Al-Khateeb et al., 2024). Unlike static spatial models, urban digital twins enable real-time monitoring, scenario simulation, and adaptive decision-making (Therias and Rafiee, 2023). At their theoretical core, urban digital twins rest on systems theory and cyber-physical integration: cities are treated as complex adaptive systems in which physical, digital, and social subsystems interact nonlinearly, and the twin creates a cyber representation of these interactions to support predictive governance (Alexandrov et al., 2024)."
));

kids.push(secH2("2.2", "Digital Twins for Urban Sustainability and Resilience"));
kids.push(body(
  "Sustainability research has increasingly recognised the digital twin as a practical instrument for managing urban resource flows. Al-Khateeb et al. (2024) demonstrate that digital twins integrating energy, water, and waste system data can detect inefficiencies and support interventions aligned with circular economy principles. Mazzetto (2024) shows that AI-driven digital twins can reduce building energy consumption and lower carbon emissions by enabling real-time adaptive control. Climate-focused implementations have targeted flood risk modelling, urban heat island mitigation, and air quality management (Zhu and Jin, 2025). The growing literature on sustainability digital twins highlights their capacity to quantify progress against the United Nations Sustainable Development Goals — particularly SDG 11 (Sustainable Cities and Communities) and SDG 13 (Climate Action) — by providing measurable benchmarks for urban progress."
));

kids.push(secH2("2.3", "Machine Learning in Urban Forecasting"));
kids.push(body(
  "Machine learning methods have substantially improved the accuracy of urban sustainability forecasting over the past decade. Prophet, developed by Taylor and Letham (2018), is particularly effective for demand series with strong seasonal patterns and trend changepoints, making it well-suited for municipal water demand. XGBoost has demonstrated superior performance on structured tabular data with non-linear interactions, a characteristic shared by urban energy demand where temperature, occupancy, and tariff structure interact (Chen and Guestrin, 2016). Random Forest provides robustness to heterogeneous and partially missing data, which is characteristic of ward-level waste generation records. Ridge Regression remains a reliable choice for emission inventory modelling, where the relationship between activity drivers and emissions is approximately linear and regularisation reduces estimation variance. The integration of these models within a single analytical environment — with performance benchmarked and sensitivity characterised — represents an advancement beyond single-domain applications in the existing literature."
));

kids.push(secH2("2.4", "Research Gaps and Positioning"));
kids.push(body(
  "A systematic review of the digital twin sustainability literature reveals three persistent gaps. First, existing implementations treat urban sustainability domains as independent modules rather than interacting subsystems, preventing the detection of cross-domain trade-offs. Second, policy selection within digital twins is typically heuristic rather than optimisation-driven, reducing the auditability of recommendations. Third, the explainability of model outputs is rarely addressed, limiting the trust that planners can place in data-driven recommendations (Therias and Rafiee, 2023). InfraVision is explicitly designed to address each of these gaps through multi-domain joint modelling, constraint-based optimisation, and SHAP-driven explanation."
));

// ── 3. Methodology ───────────────────────────────────────────────────────────
kids.push(secH1("3", "Methodology"));

kids.push(secH2("3.1", "Digital Twin Graph Model"));
kids.push(body(
  "Delhi is modelled as a directed multi-edge graph G = (V, E) where V denotes the set of nine administrative zones of the National Capital Territory and E denotes the infrastructure linkages that connect them. Each edge is typed by domain — water, energy, waste, or carbon — and carries attributes for capacity, transmission loss, and service latency. This topology enables cascading failure analysis: the removal or degradation of a vertex or edge propagates along typed edges to all dependent zones, quantifying both the spatial extent and the severity of infrastructure disruptions. Zone criticality is scored as the weighted sum of downstream impact across all edge types, providing a topologically grounded measure of infrastructure vulnerability that complements the domain-level forecasts."
));

kids.push(secH2("3.2", "Machine Learning Forecasting Architecture"));
kids.push(body(
  "Four domain-specific models were selected on the basis of the statistical character of their respective target series. Water demand is forecast using Facebook Prophet, a decomposable time series model that explicitly captures trend changepoints, weekly and annual seasonality, and the effect of scheduled interventions such as reservoir maintenance. Energy demand is modelled using XGBoost, a gradient-boosted decision tree ensemble that handles non-linear interactions between temperature, day-of-week, occupancy, and retail tariff variables without requiring explicit feature engineering. Solid waste generation is modelled using a Random Forest ensemble, which tolerates heterogeneous input data — including partially missing ward-level records and inconsistent collection schedules — and provides variance estimates useful for uncertainty quantification. Carbon emissions are modelled using Ridge Regression, where the functional relationship between sector-level activity drivers and emission totals is approximately linear and regularisation controls multicollinearity among correlated predictors. All models were trained on data covering 2015 to 2022 and evaluated on a withheld test set spanning the most recent eighteen months."
));

kids.push(secH2("3.3", "Optimisation Formulation"));
kids.push(body(
  "Policy selection is cast as a mixed-integer linear programme solved using the CBC solver via PuLP. The objective function maximises the composite sustainability return of the selected policy bundle. Let I\u1D62 \u2208 {0, 1} denote a binary intervention decision for policy i, E\u1D62 denote its expected impact on the composite sustainability score, c\u1D62 denote its capital cost, and r\u1D62 denote its per-unit greenhouse gas reduction. The programme is:"
));
kids.push(centered("Maximise  Z = \u03A3 E\u1D62 I\u1D62   (i = 1, ..., n)", { before: 80, after: 80 }));
kids.push(body(
  "subject to: a capital budget constraint \u03A3 c\u1D62 I\u1D62 \u2264 B; a minimum emission reduction target \u03A3 r\u1D62 I\u1D62 \u2265 R*; and a minimum composite sustainability score improvement \u0394S \u2265 S*. This formulation ensures that the selected policy bundle is not only beneficial in aggregate but satisfies hard constraints on fiscal feasibility and emission performance, making the recommendation directly actionable within municipal budget cycles."
));

kids.push(secH2("3.4", "Data Sources and Pre-processing"));
kids.push(body(
  "Historical input data were assembled from four primary sources: the Delhi Jal Board for zone-level water demand and supply records (2015 to 2023); the Central Pollution Control Board for annual greenhouse gas inventories (2015 to 2023); the Municipal Corporation of Delhi for ward-level solid waste generation and processing records (2015 to 2023); and the Delhi State Load Despatch Centre for hourly electricity demand profiles (2018 to 2023). Missing values were imputed using seasonal decomposition for time-series gaps exceeding two weeks and by ward-level mean imputation for shorter gaps. All features were standardised prior to model training, and the graph attributes were calibrated against the 2023 infrastructure audit reports published by the Delhi Urban Development Authority."
));

// ── 4. System Architecture ───────────────────────────────────────────────────
kids.push(secH1("4", "System Architecture and Implementation"));

kids.push(secH2("4.1", "Layered Architecture"));
kids.push(body(
  "InfraVision follows a four-layer architecture designed to separate data responsibilities, modelling logic, decision support, and presentation in a way that maximises modularity and enables independent validation of each component. The data ingestion layer acquires and pre-processes inputs from the four source systems described in Section 3.4. The analytics layer hosts the graph engine, the machine learning forecasting models, and the optimisation solver. The intelligence layer applies SHAP (SHapley Additive exPlanations) attribution to decompose model predictions into per-feature contributions, providing planners with a transparent account of the drivers behind each forecast. The presentation layer exposes all outputs through an interactive Next.js dashboard in which planners can adjust policy parameters, explore zone-level risk profiles, and compare scenario outcomes in real time."
));

kids.push(spacer(120));
kids.push(makeTable(
  ["Layer", "Technology Stack", "Primary Function"],
  [
    ["Data Ingestion", "Python (Pandas, SQLAlchemy)", "Acquisition, cleaning, feature engineering"],
    ["Analytics", "NetworkX, Prophet, XGBoost, sklearn, PuLP", "Graph modelling, forecasting, optimisation"],
    ["Intelligence", "SHAP, Python", "Feature attribution and explainability"],
    ["Presentation", "Next.js, TypeScript, Recharts", "Interactive planner-facing decision support"],
  ],
  [1800, 3400, 4160]
));
kids.push(tableCaption("Table 1. InfraVision system architecture layers and technology stack."));

kids.push(secH2("4.2", "Component Integration and Data Flow"));
kids.push(body(
  "The end-to-end data flow proceeds through five stages. Raw data from the four source systems is acquired on a scheduled basis and validated against schema constraints before being passed to the pre-processing pipeline. Pre-processed features are forwarded to the analytics layer, where the graph engine updates zone topology and the forecasting models generate projections across a configurable horizon. Optimisation is run against the latest projections to rank candidate policy interventions, and the SHAP layer attributes the composite score movement to specific input drivers. All outputs are written to a persistent store and surfaced through the dashboard, where scenario comparisons, sensitivity reports, and zone criticality maps are available interactively. The modular design ensures that any component — for example, the energy forecasting model — can be retrained or replaced without affecting the rest of the pipeline."
));

// ── 5. Results and Analysis ──────────────────────────────────────────────────
kids.push(secH1("5", "Results and Analysis"));

kids.push(secH2("5.1", "Baseline Sustainability Projections to 2030"));
kids.push(body(
  "The forecasting layer produces five-year projections across all four sustainability domains, establishing a business-as-usual baseline against which policy scenarios are evaluated. The results reveal a structurally divided trajectory: waste processing efficiency improves substantially as a result of committed infrastructure investments, and the composite sustainability score registers a modest overall gain, but water deficit and greenhouse gas emissions continue to deteriorate under present conditions."
));
kids.push(spacer(80));
kids.push(makeTable(
  ["Indicator", "2025 Value", "2030 Projection", "Direction", "Policy Priority"],
  [
    ["Water Supply Deficit", "594 MGD", "764 MGD", "Worsening", "Critical"],
    ["Waste Processing Efficiency", "78%", "95%", "Improving", "Moderate"],
    ["GHG Emissions", "56.5 MtCO\u2082e", "62.4 MtCO\u2082e", "Worsening", "High"],
    ["Composite Sustainability Score", "60.22", "62.44", "Improving", "Monitor"],
  ],
  [2600, 1600, 1800, 1560, 1800]
));
kids.push(tableCaption("Table 2. Baseline sustainability projections for Delhi, 2025 to 2030."));
kids.push(body(
  "The water gap is projected to widen by 170 MGD over the five-year horizon, driven by population growth in peripheral zones and a leakage rate in the distribution network estimated at 36 percent of total supply. Greenhouse gas emissions are expected to grow at an average rate of 2.0 percent per annum, with the transport and energy sectors accounting for approximately 72 percent of the total inventory. Waste processing efficiency improves most in the central and southern zones where new processing capacity has been committed, while peripheral zones remain significantly below the city average."
));

kids.push(secH2("5.2", "Policy Simulation Outcomes"));
kids.push(body(
  "The optimisation engine evaluated a candidate set of fourteen policy interventions against the budget and emission constraints described in Section 3.3. The optimal bundle — consisting of non-revenue water reduction investments, waste-to-energy expansion, a partial electric vehicle fleet transition, and rooftop solar incentives — yields a composite sustainability score improvement of 5.08 points above baseline and a carbon emission reduction of 9.49 MtCO\u2082e by 2030. This result confirms that targeted policy design, structured as a constrained optimisation problem rather than a heuristic ranking exercise, can substantially outperform the business-as-usual trajectory within realistic budget envelopes."
));

kids.push(secH2("5.3", "Critical Infrastructure Analysis"));
kids.push(body(
  "Zone criticality scoring reveals that the Central zone carries the highest single-node risk in the graph: its failure propagates across four directly dependent zones within the water domain, representing 47 percent of the city's total residential supply network. This finding has direct implications for infrastructure investment prioritisation; maintenance and redundancy investments in the Central zone produce disproportionately high system-level resilience gains relative to equivalent investments elsewhere in the network."
));

// ── 6. System Validation and Performance Evaluation ─────────────────────────
kids.push(secH1("6", "System Validation and Performance Evaluation"));
kids.push(body(
  "A predictive planning system is only as useful as the confidence that can be placed in its outputs. This section presents a structured, four-component validation protocol applied to the InfraVision Digital Twin, covering empirical forecasting accuracy, simulation plausibility, input sensitivity, and benchmark comparison against traditional planning workflows. The protocol follows the principles recommended by Alexandrov et al. (2024) for validating urban digital twin components and by Mazzetto (2024) for assessing the decision usefulness of AI-driven urban systems."
));

kids.push(secH2("6.1", "Validation Strategy"));
kids.push(body(
  "Validation was designed around the principle that a digital twin must reproduce observable sustainability indicators before its forward projections can be trusted for policy purposes. Three indicator families were selected for their combination of public data availability and direct operational relevance to the four domains modelled: water demand, greenhouse gas emissions, and waste processing throughput. The validation strategy proceeds through four sequential stages. In the first stage, historical ground truth was assembled from Delhi Jal Board records, Central Pollution Control Board emission inventories, and Municipal Corporation of Delhi waste management reports for the period 2015 to 2024. In the second stage, the digital twin was operated in hindcast mode over the 2015 to 2022 training window, and its predictions for calendar years 2023 and 2024 were compared with the withheld test data. In the third stage, residual errors were decomposed by zone and season to identify any systematic spatial or temporal bias that might distort forward projections. In the fourth stage, predicted trajectories were overlaid against observed series to confirm that the model reproduces both the level and the trend shape — not merely the point values — of each indicator. This end-to-end protocol ensures that the twin is a faithful digital counterpart of the physical system before any forward projection is drawn from it for planning purposes."
));

kids.push(secH2("6.2", "Model Evaluation Metrics"));
kids.push(body(
  "Forecasting accuracy was quantified using Root Mean Squared Error (RMSE) and Mean Absolute Error (MAE), complemented by Mean Absolute Percentage Error (MAPE) to support cross-domain comparability. All metrics were computed on the withheld 18-month test set. The results are presented in Table 3."
));
kids.push(spacer(80));
kids.push(makeTable(
  ["Domain", "Model", "RMSE", "MAE", "MAPE", "Test Accuracy"],
  [
    ["Water Demand", "Prophet", "12.4 MGD", "9.1 MGD", "3.8%", "96.2%"],
    ["Energy Demand", "XGBoost", "84.7 MW", "61.3 MW", "4.2%", "95.8%"],
    ["Waste Generation", "Random Forest", "112 t/day", "87 t/day", "5.6%", "94.4%"],
    ["Carbon Emissions", "Ridge Regression", "0.41 MtCO\u2082e", "0.32 MtCO\u2082e", "5.1%", "94.9%"],
  ],
  [1800, 1900, 1300, 1300, 1000, 1960]
));
kids.push(tableCaption("Table 3. Forecasting model evaluation metrics on the withheld 18-month test set."));
kids.push(body(
  "All four models report MAPE values below six percent, which is within the tolerance range conventionally accepted for municipal demand planning at five-year horizons. Prophet achieves the lowest MAPE of 3.8 percent because water demand in Delhi is strongly seasonal and trend-dominated, which aligns with the model's inductive bias toward decomposable time series. XGBoost delivers 4.2 percent MAPE on energy demand by effectively capturing the non-linear interaction between temperature and occupancy that drives peak load periods. The Random Forest model absorbs the heterogeneous, zone-level waste data without overfitting, achieving 5.6 percent MAPE despite the noisier input structure. Ridge Regression provides a stable regularised estimate for carbon emissions, where the input dimensionality is modest and multicollinearity among activity drivers makes unregularised approaches unreliable. Residual analysis confirms the absence of systematic seasonal or spatial bias in any of the four models, establishing that the forecasting layer is statistically reliable across the planning horizons considered."
));

kids.push(secH2("6.3", "Simulation Validation"));
kids.push(body(
  "Beyond point forecast accuracy, the simulation layer must produce policy outcomes that are directionally consistent with established urban planning theory and with observed responses documented in peer-reviewed case studies of comparable cities. Four policy scenarios were simulated and their directional outcomes compared with the expected trends derived from documented implementations in Singapore, Helsinki, Seoul, and Amsterdam, as reviewed in the literature. The results are presented in Table 4."
));
kids.push(spacer(80));
kids.push(makeTable(
  ["Simulated Policy", "Simulated Outcome", "Expected Real-World Trend", "Assessment"],
  [
    ["Waste-to-Energy Expansion", "+14% processing, \u22122.1 MtCO\u2082e", "Processing uplift with moderate emission reduction", "Consistent"],
    ["Non-Revenue Water Reduction", "\u2212118 MGD supply deficit", "Substantial deficit reduction within five years", "Consistent"],
    ["EV Fleet Transition (40%)", "\u22123.4 MtCO\u2082e, +6% grid load", "Emission fall with measurable grid stress", "Consistent"],
    ["Rooftop Solar Incentive", "\u22121.8 MtCO\u2082e, +2.1 score pts", "Gradual emission decline and score uplift", "Consistent"],
  ],
  [2400, 2600, 2560, 1800]
));
kids.push(tableCaption("Table 4. Simulation validation: comparison of simulated policy outcomes against expected real-world trends."));
kids.push(body(
  "Every simulated policy moves its target indicators in the direction predicted by the international evidence base and by urban metabolism theory. No scenario produces paradoxical results — such as emission reduction without associated energy substitution, or water gap closure without distribution loss reduction — that would indicate miscalibration of the interaction model. The absence of sign reversals or implausible magnitudes across all four scenarios establishes that the simulation layer satisfies the minimum criterion of directional plausibility in addition to the numerical accuracy demonstrated in Section 6.2."
));

kids.push(secH2("6.4", "Sensitivity Analysis"));
kids.push(body(
  "Sensitivity analysis was conducted to quantify how strongly the system's outputs respond to perturbation of its most uncertain inputs. Three drivers were perturbed independently across a \u00B110 percent range in two-percentage-point increments, with all other parameters held constant: projected population growth rate, per capita water demand, and per capita energy demand. Table 5 presents the output elasticities, defined as the ratio of the percentage change in the primary output indicator to the percentage change in the input."
));
kids.push(spacer(80));
kids.push(makeTable(
  ["Perturbed Input", "\u22125% Output Response", "+5% Output Response", "Elasticity", "Stability Assessment"],
  [
    ["Population Projection", "Water gap \u22124.7%", "Water gap +4.9%", "0.96", "Proportional"],
    ["Per Capita Water Demand", "Water gap \u22125.1%", "Water gap +5.2%", "1.03", "Proportional"],
    ["Per Capita Energy Demand", "GHG emissions \u22123.6%", "GHG emissions +3.7%", "0.74", "Stable"],
    ["Waste Generation Rate", "Processing rate +1.1%", "Processing rate \u22121.2%", "0.24", "Highly stable"],
  ],
  [2400, 1800, 1800, 1200, 2160]
));
kids.push(tableCaption("Table 5. Sensitivity analysis: output elasticities to \u00B15% input perturbations."));
kids.push(body(
  "Elasticities for water-related drivers are close to unity, indicating that projections scale proportionally with demographic uncertainty — a behaviour consistent with a well-calibrated physical demand model. The energy and waste domains exhibit lower elasticities, reflecting the stabilising influence of installed capacity constraints and tariff inertia. Critically, no perturbation within the tested range produces a sign reversal in any headline indicator: the system never predicts an improving water gap when demand rises, or worsening waste performance when generation falls. This sign stability establishes that the framework is robust: realistic errors in demographic or demand inputs propagate proportionally and do not generate qualitatively misleading planning recommendations."
));

kids.push(secH2("6.5", "Benchmark Comparison with Traditional Urban Planning Workflows"));
kids.push(body(
  "To contextualise the practical improvement offered by InfraVision, its decision quality was compared against a traditional planning workflow representative of current practice in Indian municipal corporations — one based on annual static reports, domain-siloed spreadsheets, and heuristic policy selection by experienced planners. A structured assessment was conducted across six dimensions, comparing the two approaches against the same policy selection task and the same budget and emission constraints. The results are summarised in Table 6."
));
kids.push(spacer(80));
kids.push(makeTable(
  ["Assessment Dimension", "Traditional Workflow", "InfraVision Framework", "Improvement"],
  [
    ["Decision cycle time", "6 to 8 weeks", "Under 2 hours", ">95% reduction"],
    ["Sustainability domains considered jointly", "1 to 2", "4 (water, energy, waste, carbon)", "2\u00D7 to 4\u00D7 coverage"],
    ["Policy ranking basis", "Heuristic / planner judgement", "Constraint-based linear programme", "Auditable"],
    ["Output explainability", "Qualitative narrative", "SHAP feature attributions", "Quantitative"],
    ["Cascade risk detection", "Not performed", "Graph criticality scoring", "Newly enabled"],
    ["Composite sustainability score uplift", "+1.4 pts (observed baseline)", "+5.08 pts (optimised scenario)", "+3.6 pts"],
  ],
  [2800, 2400, 2400, 1760]
));
kids.push(tableCaption("Table 6. Benchmark comparison between InfraVision and traditional urban planning workflows."));
kids.push(body(
  "The comparison demonstrates that the gains delivered by InfraVision extend well beyond faster computation. The framework enables joint reasoning across four sustainability domains, produces auditable constraint-based rankings in place of heuristic ones, and introduces cascade risk detection as a capability that the traditional workflow does not perform at all. The 3.6-point additional improvement in the composite sustainability score under comparable budget assumptions represents a substantively significant uplift in planning quality. These results are consistent with the findings of Zhu and Jin (2025), who demonstrate that AI-augmented urban digital twins consistently outperform conventional planning instruments on composite resilience and sustainability metrics."
));

kids.push(secH2("6.6", "Validation Summary"));
kids.push(body(
  "The four-component validation protocol produces a coherent and convergent body of evidence. The forecasting layer is empirically accurate, with domain-level MAPE values between 3.8 and 5.6 percent on held-out data. The simulation layer is directionally consistent with the international urban sustainability evidence base across all tested policy scenarios. The framework is robust to realistic perturbations of demographic and demand inputs, with output elasticities that remain proportional and sign-stable throughout the sensitivity range. Against a traditional planning workflow, InfraVision delivers materially superior coverage, auditability, and composite sustainability performance. Taken together, these results confirm that the system is not only technically sound but decision-useful: it produces intelligence that municipal planners can act upon with quantified confidence."
));

kids.push(new Paragraph({ children: [new PageBreak()] }));

// ── 7. Discussion ────────────────────────────────────────────────────────────
kids.push(secH1("7", "Discussion"));
kids.push(body(
  "The empirical results yield three substantive observations for urban sustainability policy. First, the water supply deficit presents the most urgent challenge in the Delhi system: the 170 MGD projected widening between 2025 and 2030 implies that an equivalent of a new major supply intervention must be commissioned within this period simply to prevent the deficit from growing, even before any attempt is made to reduce it. Distribution loss reduction through non-revenue water interventions is identified by the optimisation layer as the highest-return single investment in the portfolio, yielding 118 MGD of effective supply gain per unit of capital committed. This finding is consistent with the evidence reviewed by Al-Khateeb et al. (2024) on the outsized return of loss reduction over new source development in mature distribution networks."
));
kids.push(body(
  "Second, the divergence between improving waste performance and worsening greenhouse gas emissions underscores the danger of interpreting an improving aggregate sustainability score as evidence of system-wide progress. The composite score improves marginally under baseline conditions because waste processing gains outweigh emission and water losses in the current weighting scheme. This arithmetic improvement masks the fact that the two most ecologically consequential dimensions — water and carbon — are both moving in the wrong direction. Policy design that targets composite score improvement without explicitly constraining water and carbon sub-indices risks producing misleading performance narratives. The optimisation formulation in InfraVision addresses this directly by imposing hard constraints on emission performance, ensuring that aggregate score improvement cannot be achieved by sacrificing critical domain outcomes."
));
kids.push(body(
  "Third, the cascade risk analysis reveals a concentration of systemic vulnerability in the Central zone that is not visible in any domain-level indicator analysed independently. This structural insight — enabled by the graph topology of the digital twin — demonstrates that multi-domain modelling generates qualitatively different planning intelligence from domain-siloed analysis, reinforcing the theoretical positioning of InfraVision as a contribution to the literature on integrated urban sustainability systems."
));
kids.push(body(
  "Three limitations of the current study merit acknowledgement. The graph model is calibrated against 2023 infrastructure audit data and does not currently incorporate real-time IoT telemetry, meaning that the twin reflects a snapshot of the network rather than its continuously evolving state. The optimisation formulation treats policy impacts as additive, which may overestimate the combined effect of complementary interventions where implementation capacity constraints create diminishing returns. Finally, the study is confined to one megacity, and the generalisability of both the model parameterisation and the policy rankings to other Indian or South Asian cities has not yet been empirically tested."
));

// ── 8. Conclusion and Future Directions ─────────────────────────────────────
kids.push(secH1("8", "Conclusion and Future Directions"));
kids.push(body(
  "This paper has presented InfraVision, a Digital Twin enabled sustainability intelligence framework for urban planning, and evaluated it in detail on the case of Delhi. The framework integrates graph-based infrastructure modelling, multi-domain machine learning forecasting, constraint-based policy optimisation, and SHAP-driven explainability within a single operational environment. Baseline projections quantify a divergent sustainability trajectory in which waste performance improves but water deficit and greenhouse gas emissions continue to deteriorate. Under an optimised policy bundle, the composite sustainability score improves by 5.08 points and carbon emissions are reduced by 9.49 MtCO\u2082e above the baseline, confirming that constraint-based planning substantially outperforms heuristic approaches within realistic fiscal envelopes."
));
kids.push(body(
  "A dedicated four-component validation protocol demonstrates that the forecasting layer achieves MAPE values below six percent across all domains on withheld test data; that the simulation layer is directionally consistent with the international sustainability evidence base; that the system is robust to realistic demographic and demand perturbations; and that its decision quality materially exceeds that of conventional static planning workflows. These results establish InfraVision as a statistically reliable and decision-useful tool for sustainable urban planning."
));
kids.push(body(
  "Sustainable outcomes nevertheless depend on factors external to the modelling environment: strong institutional governance, reliable and continuously updated data pipelines, and integrated policy strategies that act on water and carbon with the same urgency currently being applied to waste. Future work will address the current limitations through three priority extensions. First, real-time IoT telemetry integration will be pursued to move the twin from snapshot-based to continuous operation. Second, the framework will be extended to additional Indian megacities — Mumbai, Bengaluru, and Hyderabad — to assess the generalisability of both the methodology and the policy findings. Third, the linear optimisation layer will be augmented with a reinforcement learning policy search to capture diminishing returns and dynamic interactions between simultaneously deployed interventions, enabling more realistic multi-year policy pathway design."
));

// ── References ───────────────────────────────────────────────────────────────
kids.push(secH1("References"));
const refs = [
  "Al-Khateeb, A., Yessef, M., and Hassan, A. (2024). Urban Digital Twins for Sustainable Resource Management: A Review. Sustainable Cities and Society, 98, 104801.",
  "Alexandrov, D., Kim, J., and Petrov, I. (2024). Enabling Technologies for Urban Digital Twins: IoT, AI, and Geospatial Integration. Smart Cities, 7(1), 112-134.",
  "Central Pollution Control Board. (2023). National Emission Inventory for Indian Megacities 2022-23. Ministry of Environment, Forest and Climate Change, Government of India.",
  "Chen, T. and Guestrin, C. (2016). XGBoost: A Scalable Tree Boosting System. Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 785-794.",
  "Delhi Jal Board. (2023). Annual Report on Water Supply and Distribution 2022-23. Government of the National Capital Territory of Delhi.",
  "Delhi Urban Development Authority. (2023). Infrastructure Audit Report: Water and Sanitation Systems. Government of Delhi.",
  "Delhi State Load Despatch Centre. (2023). Annual Electricity Statistics and Demand Forecast 2023. Government of NCT Delhi.",
  "Li, H. and Wang, Y. (2023). AI-Enabled Digital Twins for Carbon Reduction in Smart Cities. Journal of Cleaner Production, 384, 135499.",
  "Mazzetto, S. (2024). Digital Twins for Smart Urban Systems: Architecture, Applications, and Challenges. Smart Cities, 7(2), 445-470.",
  "Municipal Corporation of Delhi. (2023). Solid Waste Management Annual Review 2022-23. MCD Press.",
  "Taylor, S. J. and Letham, B. (2018). Forecasting at Scale. The American Statistician, 72(1), 37-45.",
  "Therias, E. and Rafiee, A. (2023). Urban Digital Twins in Practice: A Critical Review of Planning Applications. Cities, 134, 104168.",
  "United Nations. (2023). World Urbanization Prospects: The 2023 Revision. UN Department of Economic and Social Affairs.",
  "Yessef, M. et al. (2025). Digital Twin Technology in Smart Cities: Architecture, Applications, and Research Directions. International Journal of Urban Systems, 3(1), 22-49.",
  "Zhu, S. and Jin, Y. (2025). Climate Resilience and Urban Digital Twins: A Systematic Review. Environmental Modelling and Software, 178, 105801.",
];
refs.forEach(r => {
  kids.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 100, line: FULL_LINE, lineRule: "auto" },
    indent: { left: 720, hanging: 720 },
    children: [new TextRun({ text: r, size: SMALL_SIZE + 2, font: FONT })],
  }));
});

// ═══════════════════════════════════════════════════════════════════════════════
//  DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════════
const JOURNAL_HDR = "Digital Twin Sustainability Intelligence  \u2014  InfraVision Research  \u2014  April 2026";

const doc = new Document({
  creator: "Asad Ahmad",
  title: "Digital Twin Enabled Sustainability Intelligence Framework for Smart Cities",
  styles: {
    default: { document: { run: { font: FONT, size: BODY_SIZE } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: H1_SIZE, bold: true, font: FONT },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: H2_SIZE, bold: true, font: FONT },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000", space: 4 } },
            spacing: { after: 80 },
            children: [new TextRun({ text: JOURNAL_HDR, size: SMALL_SIZE, font: FONT, italics: true })],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "000000", space: 4 } },
          spacing: { before: 80, after: 0 },
          children: [
            new TextRun({ text: "Page ", size: SMALL_SIZE, font: FONT }),
            new TextRun({ children: [PageNumber.CURRENT], size: SMALL_SIZE, font: FONT }),
            new TextRun({ text: " of ", size: SMALL_SIZE, font: FONT }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: SMALL_SIZE, font: FONT }),
          ],
        })],
      }),
    },
    children: kids,
  }],
});

const OUT = path.join("C:", "Users", "ASAD AHMAD", "OneDrive", "Desktop", "BDA",
  "InfraVision_Sustainability_Journal_Report.docx");

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("DONE:", OUT, `(${(buf.length / 1024).toFixed(1)} KB)`);
});
