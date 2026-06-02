<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitAssessmentRequest;
use App\Http\Resources\AssessmentResponseResource;
use App\Models\Assessment;
use App\Models\AssessmentResponse;
use App\Events\AssessmentSubmitted;
use App\Services\DsriCalculationService;
use App\Services\RealtimePublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
    public function __construct(private DsriCalculationService $dsriService) {}

    public function landing(Request $request): JsonResponse
    {
        $assessment = Assessment::first();

        return response()->json([
            'assessment' => $assessment,
            'has_previous' => $request->user()->assessmentResponses()->exists(),
        ]);
    }

    public function start(Request $request): JsonResponse
    {
        $assessment = Assessment::first();

        $questions = collect($this->dsriService->getCompetencies())->map(function ($config, $code) {
            return [
                'section_code' => $code,
                'section_name' => $config['name_en'],
                'section_name_ms' => $config['name_ms'],
                'weight' => $config['weight'],
                'max_score' => $config['max_score'],
                'questions' => $this->getSectionQuestions($code),
            ];
        })->values();

        return response()->json([
            'assessment' => $assessment,
            'sections' => $questions,
        ]);
    }

    public function submit(SubmitAssessmentRequest $request): JsonResponse
    {
        $sectionScores = collect($request->responses)
            ->pluck('score', 'section')
            ->toArray();

        $result = $this->dsriService->calculate($sectionScores);

        $response = AssessmentResponse::create([
            'user_id' => $request->user()->id,
            'assessment_id' => $request->assessment_id,
            'submitted_at' => now(),
            'c1_score' => $result['scores']['C1'],
            'c2_score' => $result['scores']['C2'],
            'c3_score' => $result['scores']['C3'],
            'c4_score' => $result['scores']['C4'],
            'c5_score' => $result['scores']['C5'],
            'c6_score' => $result['scores']['C6'],
            'c7_score' => $result['scores']['C7'],
            'c8_score' => $result['scores']['C8'],
            'c9_score' => $result['scores']['C9'],
            'c10_score' => $result['scores']['C10'],
            'dsri' => $result['dsri'],
        ]);

        AssessmentSubmitted::dispatch($response);

        // Real-time dashboard update (non-blocking)
        try {
            (new RealtimePublisher())->publishDashboardUpdate('assessment.submitted', [
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'dsri' => $result['dsri'],
            ]);
        } catch (\Throwable $e) {
            log()->warning('Failed to publish dashboard update: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Assessment submitted successfully',
            'response' => new AssessmentResponseResource($response),
            'maturity' => $this->dsriService->getMaturityLevel($result['dsri'], $request->user()->locale ?? 'en'),
        ], 201);
    }

    public function results(Request $request): JsonResponse
    {
        $user = $request->user();
        $latest = $user->latestAssessmentResponse;
        $history = $user->assessmentResponses()->orderByDesc('submitted_at')->get();

        $latestSectionScores = null;
        if ($latest) {
            $latestSectionScores = [];
            foreach ($this->dsriService->getCompetencies() as $code => $config) {
                $field = strtolower($code) . '_score';
                $latestSectionScores[$code] = $this->dsriService->getSectionDetails(
                    $latest->$field, $code, $user->locale ?? 'en'
                );
            }
        }

        $certificate = null;
        if ($latest) {
            $cert = \App\Models\Certificate::where('assessment_response_id', $latest->id)->first();
            if ($cert) {
                $certificate = [
                    'id' => $cert->id,
                    'verification_code' => $cert->verification_code,
                    'maturity_level' => $cert->maturity_level,
                    'maturity_label_en' => $cert->maturity_label_en,
                    'issued_at' => $cert->issued_at->toIso8601String(),
                    'expires_at' => $cert->expires_at?->toIso8601String(),
                    'is_expired' => $cert->isExpired(),
                    'share_url' => url('/c/' . $cert->verification_code),
                ];
            }
        }

        return response()->json([
            'latest' => $latest,
            'history' => AssessmentResponseResource::collection($history),
            'latestSectionScores' => $latestSectionScores,
            'maturity' => $latest ? $this->dsriService->getMaturityLevel($latest->dsri, $user->locale ?? 'en') : null,
            'certificate' => $certificate,
        ]);
    }

    private function getSectionQuestions(string $code): array
    {
        $allQuestions = [
            'C1' => [
                ['id' => 'C1_Q1', 'text' => 'I can search, evaluate, and use digital information effectively.', 'text_ms' => 'Saya boleh mencari, menilai, dan menggunakan maklumat digital dengan berkesan.', 'title' => 'Information and Data Literacy', 'weight' => 2],
                ['id' => 'C1_Q2', 'text' => 'I understand how to manage my digital identity safely and healthily. (e.g. online profiles, account security)', 'text_ms' => 'Saya memahami cara mengurus identiti digital saya dengan selamat dan sihat. (contoh: profil dalam talian, keselamatan akaun)', 'title' => 'Digital Identity and Wellbeing', 'weight' => 2],
                ['id' => 'C1_Q3', 'text' => 'I can assess the authenticity and reliability of digital and media sources.', 'text_ms' => 'Saya boleh menilai kesahihan dan kebolehpercayaan sumber digital dan media.', 'title' => 'Information and Media Literacy', 'weight' => 2],
                ['id' => 'C1_Q4', 'text' => 'I can use ICT software and devices such as computers and smartphones efficiently.', 'text_ms' => 'Saya boleh menggunakan perisian dan peralatan ICT seperti komputer dan telefon pintar dengan cekap.', 'title' => 'ICT Proficiency', 'weight' => 2],
                ['id' => 'C1_Q5', 'text' => 'I have basic skills in using computers and digital devices.', 'text_ms' => 'Saya mempunyai kemahiran asas menggunakan komputer dan peranti digital.', 'title' => 'Basic Functional Skills', 'weight' => 2],
                ['id' => 'C1_Q6', 'text' => 'I can communicate professionally using digital tools such as email, instant messaging, or other communication applications.', 'text_ms' => 'Saya boleh berkomunikasi secara profesional menggunakan alat digital seperti e-mel, pesanan segera, atau aplikasi komunikasi lain.', 'title' => 'Digital Communication', 'weight' => 2],
                ['id' => 'C1_Q7', 'text' => 'I understand and keep up with the latest developments in digital technology related to my tasks and their implications for my work and daily life.', 'text_ms' => 'Saya boleh memahami dan mengikuti perkembangan terkini dalam teknologi digital yang berkaitan dengan tugas saya serta implikasinya terhadap pekerjaan dan kehidupan seharian saya.', 'title' => 'Digital Awareness', 'weight' => 3],
            ],
            'C2' => [
                ['id' => 'C2_Q1', 'text' => 'I can use a computer for basic tasks such as typing and saving documents.', 'text_ms' => 'Saya boleh menggunakan komputer untuk tugas asas seperti menaip dan menyimpan dokumen.', 'title' => 'Basic Computer Skills', 'weight' => 2],
                ['id' => 'C2_Q2', 'text' => 'I can use the Internet safely and effectively.', 'text_ms' => 'Saya boleh menggunakan Internet secara selamat dan berkesan.', 'title' => 'Online Essentials', 'weight' => 2],
                ['id' => 'C2_Q3', 'text' => 'I can efficiently use word processing software such as Microsoft Word and Google Docs.', 'text_ms' => 'Saya boleh menggunakan perisian pemprosesan perkataan seperti Microsoft Word dan Google Docs dengan cekap.', 'title' => 'Word Processing', 'weight' => 2],
                ['id' => 'C2_Q4', 'text' => 'I can create and manage data using spreadsheet software such as Excel and Google Sheets.', 'text_ms' => 'Saya boleh mencipta dan menguruskan data menggunakan perisian hamparan seperti Excel dan Google Sheets.', 'title' => 'Spreadsheets', 'weight' => 2],
                ['id' => 'C2_Q5', 'text' => 'I understand basic cybersecurity and can protect my digital data.', 'text_ms' => 'Saya memahami asas keselamatan siber dan boleh melindungi data digital saya.', 'title' => 'Cybersecurity', 'weight' => 2],
                ['id' => 'C2_Q6', 'text' => 'I can analyze data using appropriate digital tools such as Excel, Power BI, or other tools.', 'text_ms' => 'Saya boleh menganalisis data menggunakan alat digital seperti Excel, Power BI, atau alat lain.', 'title' => 'Data Analytics', 'weight' => 2],
                ['id' => 'C2_Q7', 'text' => 'I can identify and implement new digital solutions in my work.', 'text_ms' => 'Saya boleh mengenal pasti dan menerapkan penyelesaian digital baharu dalam kerja saya.', 'title' => 'Digital Innovation', 'weight' => 1],
                ['id' => 'C2_Q8', 'text' => 'I understand basic AI concepts and their applications.', 'text_ms' => 'Saya memahami konsep asas kecerdasan buatan dan aplikasinya.', 'title' => 'AI Basics', 'weight' => 1],
                ['id' => 'C2_Q9', 'text' => 'I can use cloud computing services such as Google Drive, OneDrive or Dropbox.', 'text_ms' => 'Saya boleh menggunakan perkhidmatan pengkomputeran awan seperti Google Drive, OneDrive atau Dropbox.', 'title' => 'Cloud Computing', 'weight' => 1],
            ],
            'C3' => [
                ['id' => 'C3_Q1', 'text' => 'I can communicate clearly using digital platforms such as email or messaging applications.', 'text_ms' => 'Saya boleh berkomunikasi dengan jelas menggunakan platform digital seperti e-mel atau aplikasi pesanan.', 'title' => 'Communication', 'weight' => 2],
                ['id' => 'C3_Q2', 'text' => 'I can collaborate effectively with colleagues using online collaboration tools such as Google Workspace or Microsoft Teams.', 'text_ms' => 'Saya boleh bekerjasama secara efektif dengan rakan sekerja menggunakan alat kolaborasi dalam talian seperti Google Workspace atau Microsoft Teams.', 'title' => 'Online Collaboration', 'weight' => 2],
                ['id' => 'C3_Q3', 'text' => 'I can conduct online transactions safely and efficiently.', 'text_ms' => 'Saya boleh melakukan transaksi dalam talian dengan selamat dan cekap.', 'title' => 'Transacting', 'weight' => 2],
                ['id' => 'C3_Q4', 'text' => 'I can prepare and present information using digital tools such as PowerPoint or Google Slides.', 'text_ms' => 'Saya boleh menyediakan dan menyampaikan maklumat menggunakan alat digital seperti PowerPoint atau Google Slides.', 'title' => 'Presentation', 'weight' => 2],
                ['id' => 'C3_Q5', 'text' => 'I can use digital tools to express ideas creatively through various media such as videos, infographics, or animations and adapt my communication style for different audiences.', 'text_ms' => 'Saya boleh menggunakan alat digital untuk menyampaikan idea secara kreatif melalui pelbagai media seperti video, infografik, atau animasi serta menyesuaikan gaya komunikasi untuk pelbagai audiens.', 'title' => 'Creative Communicator', 'weight' => 2],
            ],
            'C4' => [
                ['id' => 'C4_Q1', 'text' => 'I can identify and solve digital problems using a systematic approach.', 'text_ms' => 'Saya boleh mengenal pasti dan menyelesaikan masalah digital dengan pendekatan yang sistematik.', 'title' => 'Problem-Solving', 'weight' => 2],
                ['id' => 'C4_Q2', 'text' => 'I can critically evaluate digital information to make informed decisions.', 'text_ms' => 'Saya boleh menilai maklumat digital secara kritis untuk membuat keputusan yang tepat.', 'title' => 'Critical Thinking', 'weight' => 2],
                ['id' => 'C4_Q3', 'text' => 'I can search, evaluate the credibility of, and use digital information effectively in my work.', 'text_ms' => 'Saya boleh mencari, menilai kredibiliti, dan menggunakan maklumat digital dengan berkesan dalam kerja saya.', 'title' => 'Research & Information Fluency', 'weight' => 2],
                ['id' => 'C4_Q4', 'text' => 'I can use logical thinking and algorithms to solve technology-related problems.', 'text_ms' => 'Saya boleh menggunakan pemikiran logik dan algoritma untuk menyelesaikan masalah teknologi.', 'title' => 'Computational Thinking', 'weight' => 2],
                ['id' => 'C4_Q5', 'text' => 'I can use digital tools to design innovative solutions for work-related problems.', 'text_ms' => 'Saya boleh menggunakan alat digital untuk mereka bentuk penyelesaian inovatif bagi masalah kerja.', 'title' => 'Innovative Designer', 'weight' => 2],
            ],
            'C5' => [
                ['id' => 'C5_Q1', 'text' => 'I can identify online safety risks and practice digital safety measures in daily tasks.', 'text_ms' => 'Saya boleh mengenal pasti risiko keselamatan dalam talian dan mengamalkan langkah-langkah keselamatan digital dalam tugasan harian.', 'title' => 'Safety', 'weight' => 2],
                ['id' => 'C5_Q2', 'text' => 'I can protect personal and organizational data from digital threats.', 'text_ms' => 'Saya boleh melindungi data peribadi dan organisasi daripada ancaman digital.', 'title' => 'Security & Privacy', 'weight' => 2],
                ['id' => 'C5_Q3', 'text' => 'I can identify cyber threats such as phishing, malware, or online scams and take appropriate preventive measures.', 'text_ms' => 'Saya boleh mengenal pasti ancaman siber seperti phishing, malware, atau penipuan dalam talian serta mengambil langkah pencegahan yang sesuai.', 'title' => 'Cybersecurity', 'weight' => 3],
                ['id' => 'C5_Q4', 'text' => 'I can identify IT security risks and take preventive measures.', 'text_ms' => 'Saya boleh mengenal pasti risiko keselamatan IT dan mengambil langkah pencegahan.', 'title' => 'IT Security', 'weight' => 3],
            ],
            'C6' => [
                ['id' => 'C6_Q1', 'text' => 'I actively engage in digital platforms such as LinkedIn or online forums to enhance my professional engagement and development.', 'text_ms' => 'Saya aktif menggunakan platform digital seperti LinkedIn atau forum dalam talian untuk meningkatkan penglibatan dan pembangunan profesional saya.', 'title' => 'Professional Engagement', 'weight' => 1.5],
                ['id' => 'C6_Q2', 'text' => 'I can identify and use digital resources to enhance my skills.', 'text_ms' => 'Saya boleh mengenal pasti dan menggunakan sumber digital untuk meningkatkan kemahiran saya.', 'title' => 'Digital Resources', 'weight' => 1.5],
                ['id' => 'C6_Q3', 'text' => 'I can use digital technology to empower colleagues or learners.', 'text_ms' => 'Saya boleh menggunakan teknologi digital untuk memperkasa rakan sekerja atau pelajar.', 'title' => 'Empowering Learners', 'weight' => 1.5],
                ['id' => 'C6_Q4', 'text' => 'I can use digital skills to improve my job performance.', 'text_ms' => 'Saya boleh menggunakan kemahiran digital untuk meningkatkan kecekapan kerja saya.', 'title' => 'Career-Related Competences', 'weight' => 1.5],
                ['id' => 'C6_Q5', 'text' => 'I use digital technology to find career advancement opportunities.', 'text_ms' => 'Saya menggunakan teknologi digital untuk mencari peluang peningkatan kerjaya.', 'title' => 'Career Development', 'weight' => 1.5],
                ['id' => 'C6_Q6', 'text' => 'I can lead digital initiatives in my organization.', 'text_ms' => 'Saya boleh memimpin inisiatif digital dalam organisasi saya.', 'title' => 'Digital Leadership', 'weight' => 1.5],
                ['id' => 'C6_Q7', 'text' => 'I can use digital technology to improve information delivery and adapt learning approaches to meet the needs of diverse audiences.', 'text_ms' => 'Saya boleh menggunakan teknologi digital untuk memperbaiki penyampaian maklumat dan menyesuaikan pendekatan pembelajaran bagi memenuhi keperluan pelbagai audiens.', 'title' => 'Pedagogy', 'weight' => 1],
            ],
            'C7' => [
                ['id' => 'C7_Q1', 'text' => 'I can use digital technology to support business changes in my organization.', 'text_ms' => 'Saya boleh menggunakan teknologi digital untuk menyokong perubahan perniagaan dalam organisasi saya.', 'title' => 'Business Change', 'weight' => 1],
                ['id' => 'C7_Q2', 'text' => 'I can manage, deliver, and evaluate the effectiveness of digital services in an organization.', 'text_ms' => 'Saya boleh mengurus, menyampaikan, serta menilai keberkesanan perkhidmatan digital dalam organisasi.', 'title' => 'Service Management', 'weight' => 1],
                ['id' => 'C7_Q3', 'text' => 'I can use digital tools to support procurement and management processes.', 'text_ms' => 'Saya boleh menggunakan alat digital untuk menyokong proses perolehan dan pengurusan.', 'title' => 'Procurement & Management Support', 'weight' => 1],
                ['id' => 'C7_Q4', 'text' => 'I can adapt to digital changes in my organization.', 'text_ms' => 'Saya boleh menyesuaikan diri dengan perubahan digital dalam organisasi saya.', 'title' => 'Digital Transformation Skills', 'weight' => 1],
                ['id' => 'C7_Q5', 'text' => 'I understand ICT-related policies and regulations in my organization.', 'text_ms' => 'Saya memahami dasar dan peraturan berkaitan ICT dalam organisasi saya.', 'title' => 'ICT Governance', 'weight' => 1],
                ['id' => 'C7_Q6', 'text' => 'I understand the importance of digital infrastructure in daily organizational operations.', 'text_ms' => 'Saya memahami kepentingan infrastruktur digital dalam operasi harian organisasi.', 'title' => 'Digital Infrastructure', 'weight' => 1],
                ['id' => 'C7_Q7', 'text' => 'I can use digital services to enhance my work efficiency.', 'text_ms' => 'Saya boleh menggunakan perkhidmatan digital untuk meningkatkan kecekapan kerja saya.', 'title' => 'Digital Services', 'weight' => 1],
                ['id' => 'C7_Q8', 'text' => 'I understand the process of government service digitization and its impact.', 'text_ms' => 'Saya memahami proses pendigitalan perkhidmatan kerajaan dan impaknya.', 'title' => 'Government Service Digitization', 'weight' => 1],
                ['id' => 'C7_Q9', 'text' => 'I understand how digital technology impacts the digital economy.', 'text_ms' => 'Saya memahami bagaimana teknologi digital mempengaruhi ekonomi digital.', 'title' => 'Digital Economy', 'weight' => 1],
                ['id' => 'C7_Q10', 'text' => 'I can use e-Government platforms to access digital services.', 'text_ms' => 'Saya boleh menggunakan platform e-Kerajaan untuk mendapatkan perkhidmatan digital.', 'title' => 'e-Government', 'weight' => 1],
                ['id' => 'C7_Q11', 'text' => 'I understand digital data management methods in my organization.', 'text_ms' => 'Saya memahami kaedah pengurusan data secara digital dalam organisasi saya.', 'title' => 'Data Management', 'weight' => 1],
            ],
            'C8' => [
                ['id' => 'C8_Q1', 'text' => 'I can create high-quality and creative digital content using various technology tools (e.g. videos, graphics, websites).', 'text_ms' => 'Saya boleh mencipta kandungan digital yang kreatif dan berkualiti tinggi menggunakan pelbagai alat teknologi (contoh: video, grafik, laman web).', 'title' => 'Digital Creation', 'weight' => 2],
                ['id' => 'C8_Q2', 'text' => 'I can use technology to develop innovative ideas or solutions.', 'text_ms' => 'Saya boleh menggunakan teknologi untuk membangunkan idea atau penyelesaian inovatif.', 'title' => 'Digital Innovation', 'weight' => 2],
            ],
            'C9' => [
                ['id' => 'C9_Q1', 'text' => 'I understand and practice digital ethics in interactions and technology usage.', 'text_ms' => 'Saya memahami dan mengamalkan etika digital dalam interaksi serta penggunaan teknologi.', 'title' => 'Digital Ethics', 'weight' => 1],
                ['id' => 'C9_Q2', 'text' => 'I ensure equitable access to digital technology and information in my organization.', 'text_ms' => 'Saya memastikan akses yang saksama kepada teknologi dan maklumat digital dalam organisasi saya.', 'title' => 'Digital Inclusion', 'weight' => 1],
                ['id' => 'C9_Q3', 'text' => 'I use digital technology to actively participate in and contribute to the community.', 'text_ms' => 'Saya menggunakan teknologi digital untuk menyertai dan menyumbang kepada komuniti secara aktif.', 'title' => 'Social Participation', 'weight' => 1],
                ['id' => 'C9_Q4', 'text' => 'I understand digital financial literacy concepts and their application in daily life.', 'text_ms' => 'Saya memahami konsep literasi kewangan digital dan penggunaannya dalam kehidupan seharian.', 'title' => 'Financial Literacy', 'weight' => 0.5],
                ['id' => 'C9_Q5', 'text' => 'I am prepared to adapt to digital changes in work and daily life.', 'text_ms' => 'Saya bersedia untuk mengadaptasi perubahan digital dalam pekerjaan dan kehidupan harian.', 'title' => 'Readiness', 'weight' => 0.5],
                ['id' => 'C9_Q6', 'text' => 'I have adequate access to technology and digital resources to support my tasks.', 'text_ms' => 'Saya mempunyai akses yang mencukupi kepada teknologi dan sumber digital untuk menyokong tugas saya.', 'title' => 'Availability', 'weight' => 0.5],
                ['id' => 'C9_Q7', 'text' => 'I can manage emotions and social interactions effectively in a digital environment.', 'text_ms' => 'Saya boleh menguruskan emosi dan interaksi sosial dalam persekitaran digital dengan berkesan.', 'title' => 'Digital Emotional Intelligence', 'weight' => 0.5],
            ],
            'C10' => [
                ['id' => 'C10_Q1', 'text' => 'I can apply functional skills to improve work efficiency. (e.g. Fast typing, using office software)', 'text_ms' => 'Saya boleh mengaplikasikan kemahiran fungsi untuk meningkatkan kecekapan kerja. (Contoh: Menaip dengan pantas, menggunakan perisian pejabat)', 'title' => 'Functional Skills', 'weight' => 2],
                ['id' => 'C10_Q2', 'text' => 'I can use digital skills to enhance workplace productivity.', 'text_ms' => 'Saya boleh menggunakan kemahiran digital untuk meningkatkan produktiviti di tempat kerja.', 'title' => 'Workplace Skills', 'weight' => 2],
                ['id' => 'C10_Q3', 'text' => 'I can apply transversal skills such as communication, collaboration, and problem-solving using digital technology in various work contexts. (e.g. Communicating via email, collaborating on online documents)', 'text_ms' => 'Saya boleh menerapkan kemahiran silang seperti komunikasi, kolaborasi, dan penyelesaian masalah menggunakan teknologi digital dalam pelbagai konteks pekerjaan. (Contoh: Berkomunikasi melalui e-mel, bekerjasama dalam dokumen atas talian)', 'title' => 'Transversal Skills', 'weight' => 2],
                ['id' => 'C10_Q4', 'text' => 'I can manage my time and tasks using digital tools.', 'text_ms' => 'Saya boleh mengurus masa dan tugasan saya dengan menggunakan alat digital.', 'title' => 'Self-management', 'weight' => 2],
                ['id' => 'C10_Q5', 'text' => 'I can use digital technology to improve me and my family\'s quality of life.', 'text_ms' => 'Saya boleh menggunakan teknologi digital untuk meningkatkan kualiti hidup saya dan keluarga.', 'title' => 'Personal and Family Life', 'weight' => 1],
                ['id' => 'C10_Q6', 'text' => 'I can use digital tools to solve mathematical-related tasks and analysis.', 'text_ms' => 'Saya boleh menggunakan alat digital untuk menyelesaikan tugasan berkaitan matematik dan analisis.', 'title' => 'Mathematical Practice', 'weight' => 1],
            ],
        ];

        return $allQuestions[$code] ?? [];
    }
}
