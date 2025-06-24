// client/src/components/MatchGameNevsky.tsx
import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

// Цвета из Dashboard
const COLOR_BG_MAIN = "#382c23";
const COLOR_BG_PANEL = "#564433";
const COLOR_ACCENT = "#826753e3";
const COLOR_ACCENT_HOVER = "#a7866b";
const COLOR_CARD = "#f6eee8";
const COLOR_TEXT = "#f8ece2";
const COLOR_TEXT_DARK = "#33271f";
const COLOR_GREEN = "#7fc68e";

const PAIRS = [
  { left: "Пискарёв", right: "Брюнетка" },
  { left: "Пирогов", right: "Блондинка" },
  { left: "Пискарёв", right: "Художник" },
  { left: "Пирогов", right: "Военный поручик" },
];

const ALL_RIGHT_OPTIONS = [
  "Брюнетка",
  "Блондинка",
  "Военный поручик",
  "Художник",
  "Капитан",
  "Офицер",
];

export default function MatchGameNevsky({ onBack }: { onBack: () => void }) {
  // Случайно перемешиваем варианты
  const [rightItems, setRightItems] = useState(
    [...ALL_RIGHT_OPTIONS].sort(() => Math.random() - 0.5)
  );
  // Сопоставления: индекс пары -> строка-ответ
  const [matches, setMatches] = useState<(string | null)[]>(
    Array(PAIRS.length).fill(null)
  );
  const [showResult, setShowResult] = useState(false);

  function onDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) return;
    setShowResult(false);

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    // Перемещение из колонки вариантов в слот для ответа
    if (sourceId === "right-options" && destId.startsWith("pair-")) {
      const pairIndex = parseInt(destId.replace("pair-", ""));
      const movedItem = rightItems[source.index];

      const newRightItems = [...rightItems];
      newRightItems.splice(source.index, 1);

      const newMatches = [...matches];
      const itemInSlot = newMatches[pairIndex];
      newMatches[pairIndex] = movedItem;
      
      // Если в слоте уже был элемент, возвращаем его в список вариантов
      if (itemInSlot) {
        newRightItems.splice(0,0,itemInSlot);
      }
      
      setRightItems(newRightItems);
      setMatches(newMatches);
    }
    // Перемещение из слота обратно в колонку вариантов
    else if (sourceId.startsWith("pair-") && destId === "right-options") {
      const pairIndex = parseInt(sourceId.replace("pair-", ""));
      const movedItem = matches[pairIndex];

      if (!movedItem) return;

      const newMatches = [...matches];
      newMatches[pairIndex] = null;

      const newRightItems = [...rightItems];
      newRightItems.splice(destination.index, 0, movedItem);

      setMatches(newMatches);
      setRightItems(newRightItems);
    }
    // Перемещение между слотами
    else if (sourceId.startsWith("pair-") && destId.startsWith("pair-")) {
      const sourcePairIndex = parseInt(sourceId.replace("pair-", ""));
      const destPairIndex = parseInt(destId.replace("pair-", ""));
      
      const newMatches = [...matches];
      [newMatches[sourcePairIndex], newMatches[destPairIndex]] = [newMatches[destPairIndex], newMatches[sourcePairIndex]];
      setMatches(newMatches);
    }
    // Сортировка в колонке вариантов
    else if (sourceId === "right-options" && destId === "right-options") {
      const newRightItems = [...rightItems];
      const [reorderedItem] = newRightItems.splice(source.index, 1);
      newRightItems.splice(destination.index, 0, reorderedItem);
      setRightItems(newRightItems);
    }
  }

  function check() {
    setShowResult(true);
  }

  function reset() {
    setMatches(Array(PAIRS.length).fill(null));
    setRightItems([...ALL_RIGHT_OPTIONS].sort(() => Math.random() - 0.5));
    setShowResult(false);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{
        maxWidth: 700,
        margin: "40px auto",
        background: COLOR_BG_PANEL,
        borderRadius: 16,
        boxShadow: "0 4px 24px #0002",
        padding: 32,
        color: COLOR_TEXT
      }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Мини-игра: Сопоставь пару</h2>
        <div style={{ display: "flex", gap: 32, justifyContent: "space-between" }}>
          {/* Левая колонка — персонажи и слоты для ответов */}
          <div style={{ flex: 1.5 }}>
            {PAIRS.map((pair, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                <div style={{
                  background: COLOR_BG_MAIN,
                  color: COLOR_TEXT,
                  borderRadius: 8,
                  padding: "12px 18px",
                  minWidth: 140,
                  fontSize: 18,
                  fontWeight: 700,
                  textAlign: "center"
                }}>
                  {pair.left}
                </div>
                <span style={{ margin: "0 16px", color: COLOR_TEXT }}>—</span>
                <Droppable droppableId={`pair-${idx}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minWidth: 160,
                        height: 50,
                        background: snapshot.isDraggingOver ? COLOR_ACCENT_HOVER : "#b9bbbe33",
                        borderRadius: 8,
                        padding: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background-color 0.2s ease"
                      }}
                    >
                      {matches[idx] && (
                         <Draggable draggableId={matches[idx]!} index={idx}>
                         {(provided) => (
                           <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                userSelect: "none",
                                padding: "8px 12px",
                                background: COLOR_CARD,
                                color: COLOR_TEXT_DARK,
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: 17,
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                ...provided.draggableProps.style
                              }}
                           >
                            {matches[idx]}
                            {showResult && (
                              <span style={{ color: matches[idx] === pair.right ? COLOR_GREEN : "#f04747", fontWeight: 700 }}>
                                {matches[idx] === pair.right ? "✔" : "✖"}
                              </span>
                            )}
                           </div>
                         )}
                       </Draggable>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>

          {/* Правая колонка — варианты для перетаскивания */}
          <Droppable droppableId="right-options">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{ minWidth: 200, background: COLOR_BG_MAIN, borderRadius: 8, padding: 12 }}
              >
                {rightItems.map((opt, idx) => (
                  <Draggable key={opt} draggableId={opt} index={idx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          userSelect: "none",
                          padding: "10px 16px",
                          margin: "0 0 12px 0",
                          background: snapshot.isDragging ? COLOR_ACCENT_HOVER : COLOR_CARD,
                          color: COLOR_TEXT_DARK,
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 17,
                          boxShadow: snapshot.isDragging ? "0 4px 16px #82675355" : "0 2px 8px #82675322",
                          cursor: "grab",
                          ...provided.draggableProps.style
                        }}
                      >
                        {opt}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
        <div style={{ marginTop: 24, display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={check} style={{ background: COLOR_ACCENT, color: "#fff", border: "none", borderRadius: 8, padding: "10px 32px", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>Проверить</button>
          <button onClick={reset} style={{ background: "#b9bbbe", color: "#564433", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 16, cursor: "pointer", fontWeight: 600 }}>Сбросить</button>
          <button onClick={onBack} style={{ background: "#826753", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 16, cursor: "pointer", fontWeight: 600 }}>Назад</button>
        </div>
        {showResult && (
          <div style={{ marginTop: 18, textAlign: "center", fontSize: 17 }}>
            {matches.every((ans, idx) => ans === PAIRS[idx].right)
              ? <span style={{ color: COLOR_GREEN }}>Все верно! 🎉</span>
              : <span style={{ color: "#f04747" }}>Есть ошибки, попробуйте ещё раз.</span>
            }
          </div>
        )}
      </div>
    </DragDropContext>
  );
}