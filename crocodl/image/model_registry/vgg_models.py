#    Copyright (C) 2020 crocoDL developers
#
#   Permission is hereby granted, free of charge, to any person obtaining a copy of this software
#   and associated documentation files (the "Software"), to deal in the Software without
#   restriction, including without limitation the rights to use, copy, modify, merge, publish,
#   distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
#   Software is furnished to do so, subject to the following conditions:
#
#   The above copyright notice and this permission notice shall be included in all copies or
#   substantial portions of the Software.
#
#   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
#   BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
#   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
#   DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

from crocodl.runtime.keras.vgg_utils import VGGModelUtils
from crocodl.image.model_registry.capability import Capability
from crocodl.image.model_registry.base_models import BaseModel

class VGGModel(BaseModel):

    def __init__(self,architecture_name):
        super().__init__(architecture_name)

    @staticmethod
    def getArchitectureNames():
        return VGGModelUtils.getArchitectureNames()

    @staticmethod
    def getCapabilities():
        return { Capability.feature_extraction, Capability.classification }

    @staticmethod
    def getModelUtilsModule():
        return ("crocodl.runtime.keras.vgg_utils","VGGModelUtils")

    # @staticmethod
    # def getTrainable():
    #     return Trainable()
    #
    # @staticmethod
    # def getScorable():
    #     return Scorable()
    #
    # def createEmbeddingModel(self):
    #     from crocodl.runtime.keras.vgg_utils import ModelUtils
    #     return ModelUtils(self.architecture_name).createEmbeddingModel()
