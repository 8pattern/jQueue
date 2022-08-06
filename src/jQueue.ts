interface IOption<T> {
  capicity?: number;
  buildInstance?: (...args: any[]) => T;
  destoryInstance?: (instance: Awaited<T>) => void;
}

type IHandle<T, R = any> = (instance: T) => Promise<R>;

const defaultOption: Required<IOption<any>> = {
  capicity: 1,
  buildInstance: () => null,
  destoryInstance: () => null,
}

export default class JQueue<T> {
  #option: Required<IOption<T>>;
  #instances: Awaited<T>[] = [];
  #queue: IHandle<Awaited<T>>[] = [];
  #runner: Promise<void> = Promise.resolve();

  constructor(option: IOption<T> = {}) {
    this.#option = { ...defaultOption, ...option };
    if (this.#option.capicity < 1) throw new Error('"capicity" can NOT be fewer than 1.')
  }

  async #build(): Promise<Awaited<T>> {
    return await this.#option.buildInstance();
  }

  #processingCount = 0;

  #needLoop = true;

  #loop() {
    if (this.#processingCount >= this.#option.capicity) {
      if (this.#needLoop) {
        this.#runner = this.#runner.then(() => this.#loop());
        this.#needLoop = false;
      }
    } else {
      if (this.#instances.length > this.#queue.length) {
        const size = this.#instances.length - this.#queue.length;
        const instances = this.#instances.splice(0, size);
        instances.forEach(instance => this.#option.destoryInstance(instance));
      }
      if (this.#queue.length > 0) {
        if (this.#instances.length > 0) {
          const size = Math.min(this.#queue.length, this.#instances.length);
          const handles = this.#queue.splice(0, size);
          const instances = this.#instances.splice(0, size);
          this.#processingCount += size;
          this.#runner = Promise.race([
            this.#runner,
            ...handles.map((handle, index) => (
              handle(instances[index])
                .then(instance => {
                  this.#instances.push(instance as Awaited<T>);
                  this.#processingCount -= 1;
                  this.#needLoop = true;
                  this.#loop();
                })
            ))
          ])
        } else {
          const size = Math.min(this.#option.capicity - this.#processingCount, this.#queue.length);
          if (size > 0) {
            const handles = this.#queue.splice(0, size);
            this.#processingCount += size;
            this.#runner = Promise.race([
              this.#runner,
              ...handles.map(handle => (
                this.#build()
                  .then(handle)
                  .then(instance => {
                    this.#instances.push(instance as Awaited<T>);
                    this.#processingCount -= 1;
                    this.#needLoop = true;
                    this.#loop();
                  })
              ))
            ]);
          }
        }
      }
    }
  }

  async run<R>(handle: (instance: Awaited<T>) => Promise<R>) {
    return new Promise((resolve, reject) => {
      const process = async (instance: Awaited<T>) => {
        try {
          const res = await handle(instance);
          resolve(res);
        } catch (e) {
          reject(e);
        }
        return instance;
      }
      this.#queue.push(process);
      this.#loop();
    });
  }
}
