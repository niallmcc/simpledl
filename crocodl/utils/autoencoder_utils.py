# Copyright 2020 Niall McCarroll
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from tensorflow.keras.preprocessing.image import img_to_array
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, UpSampling2D
from tensorflow.keras.models import Model, load_model

from crocodl.utils.image_utils import ImageUtils
from crocodl.utils.h5utils import add_metadata

class ModelUtils(object):

    AUTOENCODER_BASIC1 = "autoencoder_basic1"
    AUTOENCODER_BASIC2 = "autoencoder_basic2"

    def __init__(self,architecture_name):
        self.architecture_name = architecture_name
        if architecture_name == ModelUtils.AUTOENCODER_BASIC1:
            self.image_size = 128
            self.stages = 3
            self.filters = 6
        elif architecture_name == ModelUtils.AUTOENCODER_BASIC2:
            self.image_size = 192
            self.stages = 3
            self.filters = 6
        else:
            raise Exception("Architecture %s not recognised")

    def getArchitectureName(self):
        return self.architecture_name

    def getImageSize(self):
        return self.image_size

    def createAutoencoder(self):
        input_img = Input(shape=(self.image_size,self.image_size, 3))  # assuming RGB colour channels

        x = input_img

        # for each stage, halve the image size and double the number of filters
        filters = self.filters
        for stage in range(self.stages):
            x = Conv2D(filters, (3, 3), activation='relu', padding='same')(x)
            x = MaxPooling2D((2, 2), padding='same')(x)
            filters = filters * 2

        # reverse the process to reconstruct the original layer
        for stage in range(self.stages):
            x = Conv2D(filters, (3, 3), activation='relu', padding='same')(x)
            x = UpSampling2D((2, 2))(x)
            filters = filters // 2

        # final convolution to decode the output
        decoded = Conv2D(3, (2, 2), activation='sigmoid', padding='same')(x)

        autoencoder = Model(input_img, decoded)
        autoencoder.compile(optimizer='adam', loss='mean_squared_error')
        return autoencoder

    def load(self,path):
        return load_model(path)

    def save(self,model,path,logs,classes):
        model.save(path)
        metadata = {
            "type": "crocodl:autoencoder",
            "architecture": self.architecture_name,
            "epochs": logs,
            "image_size": self.image_size,
            "classes": classes
        }
        add_metadata(path, metadata)


    def getInputIterator(self,folder,batch_size):
        self.datagen = ImageDataGenerator(rescale=1.0 / 255.0)
        return self.datagen.flow_from_directory(
            directory=folder,
            target_size=(self.image_size, self.image_size),
            color_mode="rgb",
            batch_size=batch_size,
            class_mode="input",
            shuffle=True,
            seed=42
        )

    def prepare(self,img):
        img = ImageUtils.convertImage(img,target_size=(self.image_size, self.image_size))
        img_arr = img_to_array(img)
        img_arr = img_arr.reshape(1, self.image_size, self.image_size, 3)
        img_arr = img_arr.astype('float32')
        img_arr *= 1.0/255.0
        return img_arr

    def score(self,model,prepared_image):
        result = model.predict(prepared_image)
        distance = float(np.mean(np.power(result[0]-prepared_image,2)))
        return {"distance":distance}

    def getEmbedding(self,embedding_model,prepared_image):
        sc = self.score(embedding_model,prepared_image)
        return sc

