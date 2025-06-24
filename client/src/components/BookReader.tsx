import React, { useEffect, useState } from 'react';
import './BookReader.css';

type Step = {
  order: number;
  type: 'text' | 'quiz' | 'unity';
  title: string;
  text?: string;
  quiz?: {
    question: string;
    options: string[];
    answer: number;
  }[];
  unityScene?: string;
};

export default function BookReader({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<any>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [quizResult, setQuizResult] = useState<number | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizResults, setQuizResults] = useState<boolean[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAlreadyPassed, setQuizAlreadyPassed] = useState(false);
  const [unityCompleted, setUnityCompleted] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/books/${bookId}`)
      .then(res => res.json())
      .then(setBook);

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/progress/${bookId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.currentStep === 'number') setStepIndex(data.currentStep);
      });
  }, [bookId]);

  useEffect(() => {
    setQuizIndex(0);
    setQuizResults([]);
    setQuizResult(null);
  }, [stepIndex]);

  useEffect(() => {
    function handleUnityMessage(event: MessageEvent) {
      if (event.data === "chapter1_scene_passed") {
        // здесь же можно реализовать начисление опыта за прохождение сцены и
        // получение достижения
        setUnityCompleted(true);
      }
    }
    window.addEventListener("message", handleUnityMessage);
    return () => window.removeEventListener("message", handleUnityMessage);
  }, []);

  const nextStep = () => {
    setQuizResult(null);
    const newStep = stepIndex + 1;
    setStepIndex(newStep);

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/progress/${bookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentStep: newStep })
    });
  };

  if (!book) return <div>Загрузка...</div>;
  if (!book.steps || !Array.isArray(book.steps) || book.steps.length === 0)
    return <div>В этой книге пока нет интерактивных шагов.</div>;

  const step: Step | undefined = book.steps[stepIndex];
  if (!step) return <div>Шаг не найден.</div>;

  return (
    <div>
      <h2>{step.title}</h2>
      {step.type === 'text' && step.text && (
        <>
          <div className="book-text">
            {step.text.split(/\n\s*\n/).map((para: string, idx: number) => (
              <p key={idx}>{para.trim()}</p>
            ))}
          </div>
        </>
      )}
      {step.type === 'quiz' && Array.isArray(step.quiz) && (
        <>
          {!quizFinished ? (
            <div className="quiz-card" style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 24px #0002",
              padding: 32,
              maxWidth: 500,
              margin: "0 auto",
              marginTop: 40,
              animation: "fadeIn 0.4s"
            }}>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18 }}>
                Вопрос {quizIndex + 1} из {step.quiz.length}
              </div>
              <div style={{ fontSize: 18, marginBottom: 18 }}>
                {step.quiz[quizIndex].question}
              </div>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {step.quiz[quizIndex].options.map((opt, i) => (
                  <li key={i} style={{ marginBottom: 12 }}>
                    <button
                      style={{
                        width: "100%",
                        padding: "12px 0",
                        borderRadius: 8,
                        border: "2px solid #a7866b",
                        background: quizResult === null ? "#f6eee8" : (
                          i === step.quiz![quizIndex].answer
                            ? "#b6e7b0"
                            : quizResult !== null && i === quizResult
                              ? "#f7b0b0"
                              : "#f6eee8"
                        ),
                        color: "#382c23",
                        fontWeight: 600,
                        fontSize: 17,
                        cursor: quizResult === null ? "pointer" : "default",
                        transition: "background 0.2s"
                      }}
                      disabled={quizResult !== null}
                      onClick={() => setQuizResult(i)}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
              {quizResult !== null && (
                <div style={{ marginTop: 18 }}>
                  {quizResult === step.quiz[quizIndex].answer
                    ? <span style={{ color: "#2a7c2a", fontWeight: 700 }}>Верно!</span>
                    : <span style={{ color: "#c0392b", fontWeight: 700 }}>Неверно!</span>
                  }
                  <br />
                  {quizIndex < step.quiz.length - 1 ? (
                    <button
                      style={{ marginTop: 16, padding: "8px 18px", borderRadius: 8, background: "#a7866b", color: "#fff", fontWeight: 700, border: "none" }}
                      onClick={() => {
                        setQuizResults([...quizResults, quizResult === step.quiz![quizIndex].answer]);
                        setQuizIndex(quizIndex + 1);
                        setQuizResult(null);
                      }}
                    >
                      Следующий вопрос
                    </button>
                  ) : (
                    <button
                      style={{ marginTop: 16, padding: "8px 18px", borderRadius: 8, background: "#7fc68e", color: "#fff", fontWeight: 700, border: "none" }}
                      onClick={() => {
                        setQuizResults([...quizResults, quizResult === step.quiz![quizIndex].answer]);
                        const correct = [...quizResults, quizResult === step.quiz![quizIndex].answer].filter(Boolean).length;
                        setQuizScore(correct);
                        setQuizFinished(true);

                        const token = localStorage.getItem('token');
                        fetch(`http://localhost:5000/api/progress/${bookId}/quiz`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({ stepOrder: step.order, correct })
                        })
                          .then(res => res.json())
                          .then(data => {
                            if (data.alreadyPassed) setQuizAlreadyPassed(true);
                          });
                      }}
                    >
                      Завершить квиз
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", marginTop: 30 }}>
              <h3>Результат квиза</h3>
              <div style={{ fontSize: 20, marginBottom: 12 }}>
                Правильных ответов: {quizScore} из {step.quiz.length}
              </div>
              {quizAlreadyPassed ? (
                <div style={{ color: "#a7866b" }}>Вы уже проходили этот квиз. Опыт не начислен повторно.</div>
              ) : (
                <div style={{ color: "#7fc68e" }}>+{quizScore * 10} XP</div>
              )}
            </div>
          )}
        </>
      )}
      {step.type === 'unity' && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 }}>
          <iframe
            src={step.unityScene}
            title="Unity Scene"
            width="970"
            height="610"
            style={{ border: 0, display: "block" }}
          />
          {unityCompleted && (
            <button onClick={nextStep} style={{ marginTop: 18 }}>Далее</button>
          )}
        </div>
      )}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 32,
        maxWidth: 700,
        marginLeft: "auto",
        marginRight: "auto"
      }}>
        {/* Кнопка "Назад" */}
        {stepIndex > 0 ? (
          <button
            style={{
              padding: "14px 38px",
              borderRadius: 10,
              background: "#a7866b",
              color: "#fff",
              fontWeight: 700,
              fontSize: 20,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px #9d826744",
              transition: "background 0.18s"
            }}
            onClick={() => setStepIndex(stepIndex - 1)}
            onMouseOver={e => (e.currentTarget.style.background = "#826753")}
            onMouseOut={e => (e.currentTarget.style.background = "#a7866b")}
          >
            ← Назад
          </button>
        ) : <div style={{ width: 120 }} />}

        {/* Прогресс-бар и текст */}
        <div style={{ flex: 1, margin: "0 24px" }}>
          <div style={{
            height: 12,
            background: "#3f4451",
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: 7,
            width: "100%"
          }}>
            <div style={{
              width: `${((stepIndex + 1) / book.steps.length) * 100}%`,
              background: "#7fc68e",
              height: "100%",
              transition: "width 0.3s"
            }}></div>
          </div>
          <div style={{ color: "#a7866b", fontSize: 15, textAlign: "center" }}>
            Прогресс: {stepIndex + 1} / {book.steps.length}
          </div>
        </div>

        {/* Кнопка "Далее" — показывать только если это не квиз или квиз уже завершён */}
        {(
          step.type === 'text' ||
          step.type === 'unity' ||
          (step.type === 'quiz' && quizFinished)
        ) && (
          <button
            style={{
              padding: "14px 38px",
              borderRadius: 10,
              background: "#7fc68e",
              color: "#fff",
              fontWeight: 700,
              fontSize: 20,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px #3b5d443a",
              transition: "background 0.18s"
            }}
            onClick={nextStep}
            onMouseOver={e => (e.currentTarget.style.background = "#5fae6e")}
            onMouseOut={e => (e.currentTarget.style.background = "#7fc68e")}
          >
            Далее →
          </button>
        )}
      </div>
    </div>
  );
}
