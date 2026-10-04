export function mockLLM(responses: string[], duration = 0) {
  const seenPrompts: string[] = [];
  const createLLM = () =>
    Promise.resolve({
      promptStreaming: (message: string) => {
        seenPrompts.push(message);
        const response = responses.shift() ?? "";
        return new ReadableStream<string>({
          start(controller) {
            const chunks: string[] = [];
            for (let i = 0; i < response.length; i += 3) {
              chunks.push(response.slice(i, i + 3));
            }
            if (duration === 0 || chunks.length === 0) {
              controller.enqueue(response);
              controller.close();
              return;
            }
            const delay = duration / chunks.length;
            let i = 0;
            function next() {
              if (i < chunks.length) {
                controller.enqueue(chunks[i]);
                i++;
                setTimeout(next, delay);
              } else {
                controller.close();
              }
            }
            next();
          },
        });
      },
      append: () => Promise.resolve(undefined),
    }) as unknown as Promise<LanguageModel>;
  return { createLLM, seenPrompts };
}
